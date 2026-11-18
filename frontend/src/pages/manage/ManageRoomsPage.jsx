import { useState } from 'react';
import { DoorOpen, Plus, SearchX } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { TableSkeleton } from '../../components/ui/TableSkeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { ManageTabs } from '../../components/manage/ManageTabs.jsx';
import { RowActions } from '../../components/manage/RowActions.jsx';
import { RoomFormModal } from '../../components/manage/RoomFormModal.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.js';
import { buildingsApi, roomsApi } from '../../api/endpoints.js';
import { formatNumber } from '../../utils/formatters.js';

// Helpers
function matchesFilters(room, searchText, buildingFilter) {
  if (buildingFilter !== 'all' && room.buildingId !== buildingFilter) return false;
  const text = searchText.trim().toLowerCase();
  if (!text) return true;
  return `${room.code} ${room.name} ${room.typeLabel}`.toLowerCase().includes(text);
}

async function loadRoomsPageData() {
  const [buildings, rooms] = await Promise.all([buildingsApi.list(), roomsApi.list()]);
  return { buildings, rooms };
}

export default function ManageRoomsPage() {
  const toast = useToast();
  const pageData = useApi(loadRoomsPageData, []);
  const [searchText, setSearchText] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const buildings = pageData.data?.buildings || [];
  const allRooms = pageData.data?.rooms || [];
  const visibleRooms = allRooms.filter((room) => matchesFilters(room, searchText, buildingFilter));

  // Handlers
  const openAddForm = () => {
    setEditingRoom(null);
    setFormOpen(true);
  };

  const openEditForm = (room) => {
    setEditingRoom(room);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    pageData.reload();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await roomsApi.remove(roomToDelete.id);
      toast.success('Room deleted', `${roomToDelete.name} and its schedules and readings were removed.`);
      setRoomToDelete(null);
      pageData.reload();
    } catch (error) {
      toast.error('Could not delete the room', error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Render
  return (
    <PageContainer
      title="Manage rooms"
      description="Classrooms, labs, offices and other rooms, each with a normal idle power (baseline)."
      actions={<Button icon={Plus} onClick={openAddForm} disabled={!buildings.length}>Add room</Button>}
    >
      <ManageTabs />

      <Card>
        <div className="flex flex-wrap items-center gap-3 p-5">
          <SearchInput id="room-search" value={searchText} onChange={setSearchText} placeholder="Search by code, name or type" label="Search rooms" />
          <div className="w-full sm:w-56">
            <label htmlFor="room-building-filter" className="sr-only">Filter by building</label>
            <select id="room-building-filter" className="select" value={buildingFilter} onChange={(event) => setBuildingFilter(event.target.value)}>
              <option value="all">All buildings</option>
              {buildings.map((building) => <option key={building.id} value={building.id}>{building.code} · {building.name}</option>)}
            </select>
          </div>
          {pageData.data && <p className="tabular ml-auto text-sm text-ink-secondary">{visibleRooms.length} of {allRooms.length} rooms</p>}
        </div>

        {pageData.loading && !pageData.data && <TableSkeleton />}
        {pageData.error && !pageData.data && <ErrorState error={pageData.error} onRetry={pageData.retry} />}
        {pageData.data && buildings.length === 0 && (
          <EmptyState icon={DoorOpen} title="Add a building first" description="Every room belongs to a building." />
        )}
        {pageData.data && buildings.length > 0 && allRooms.length === 0 && (
          <EmptyState icon={DoorOpen} title="No rooms yet" description="Add a classroom, lab or office to start finding waste." action={<Button icon={Plus} onClick={openAddForm}>Add room</Button>} />
        )}
        {pageData.data && allRooms.length > 0 && visibleRooms.length === 0 && (
          <EmptyState icon={SearchX} title="No rooms match these filters" description="Try another building or search word." />
        )}
        {visibleRooms.length > 0 && (
          <div className="max-h-[65vh] overflow-auto scrollbar-thin">
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th scope="col">Room</th>
                  <th scope="col">Building</th>
                  <th scope="col">Type</th>
                  <th scope="col" className="numeric">Floor</th>
                  <th scope="col" className="numeric">Area (m²)</th>
                  <th scope="col" className="numeric">Baseline (kW)</th>
                  <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleRooms.map((room) => (
                  <tr key={room.id}>
                    <td>
                      <p className="font-semibold">{room.name}</p>
                      <p className="text-xs text-ink-muted">{room.code}</p>
                    </td>
                    <td className="text-ink-secondary">{room.buildingName || '-'}</td>
                    <td className="text-ink-secondary">{room.typeLabel}</td>
                    <td className="numeric">{room.floor}</td>
                    <td className="numeric">{formatNumber(room.areaM2)}</td>
                    <td className="numeric">{formatNumber(room.baselineKw, 1)}</td>
                    <td>
                      <RowActions itemName={room.name} onEdit={() => openEditForm(room)} onDelete={() => setRoomToDelete(room)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <RoomFormModal
        open={formOpen}
        room={editingRoom}
        buildings={buildings}
        defaultBuildingId={buildingFilter === 'all' ? '' : buildingFilter}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
      <ConfirmDialog
        open={Boolean(roomToDelete)}
        title={roomToDelete ? `Delete ${roomToDelete.name}?` : 'Delete room?'}
        message={roomToDelete ? `${roomToDelete.name} (${roomToDelete.code}) and all of its class schedules and energy readings will be deleted. This cannot be undone.` : ''}
        confirmLabel="Delete room"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setRoomToDelete(null)}
      />
    </PageContainer>
  );
}
