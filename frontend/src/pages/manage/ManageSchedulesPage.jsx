import { useState } from 'react';
import { CalendarDays, Plus, SearchX } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { CardHeader } from '../../components/ui/CardHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { TableSkeleton } from '../../components/ui/TableSkeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { ManageTabs } from '../../components/manage/ManageTabs.jsx';
import { RowActions } from '../../components/manage/RowActions.jsx';
import { ScheduleFormModal } from '../../components/manage/ScheduleFormModal.jsx';
import { WeeklyScheduleGrid } from '../../components/manage/WeeklyScheduleGrid.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.js';
import { buildingsApi, roomsApi, schedulesApi } from '../../api/endpoints.js';
import { formatHourRange } from '../../utils/formatters.js';

// Helpers
async function loadSchedulesPageData() {
  const [buildings, rooms, schedules] = await Promise.all([buildingsApi.list(), roomsApi.list(), schedulesApi.list()]);
  return { buildings, rooms, schedules };
}

function filterRoomsByBuilding(rooms, buildingFilter) {
  if (buildingFilter === 'all') return rooms;
  return rooms.filter((room) => room.buildingId === buildingFilter);
}

function filterSchedules(schedules, visibleRoomIds, roomFilter, searchText) {
  const text = searchText.trim().toLowerCase();
  return schedules.filter((schedule) => {
    if (roomFilter !== 'all' && schedule.roomId !== roomFilter) return false;
    if (!visibleRoomIds.includes(schedule.roomId)) return false;
    if (!text) return true;
    return `${schedule.courseName} ${schedule.roomCode} ${schedule.roomName}`.toLowerCase().includes(text);
  });
}

export default function ManageSchedulesPage() {
  const toast = useToast();
  const pageData = useApi(loadSchedulesPageData, []);
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const buildings = pageData.data?.buildings || [];
  const allRooms = pageData.data?.rooms || [];
  const allSchedules = pageData.data?.schedules || [];
  const roomsInBuilding = filterRoomsByBuilding(allRooms, buildingFilter);
  const visibleRoomIds = roomsInBuilding.map((room) => room.id);
  const visibleSchedules = filterSchedules(allSchedules, visibleRoomIds, roomFilter, searchText);
  const selectedRoom = allRooms.find((room) => room.id === roomFilter);
  const selectedRoomSchedules = allSchedules.filter((schedule) => schedule.roomId === roomFilter);

  // Handlers
  const changeBuilding = (buildingId) => {
    setBuildingFilter(buildingId);
    setRoomFilter('all');
  };

  const openAddForm = (prefill) => {
    setEditingSchedule(null);
    setFormPrefill(prefill || { roomId: roomFilter === 'all' ? '' : roomFilter });
    setFormOpen(true);
  };

  const openAddFromGrid = (dayOfWeek, hour) => {
    openAddForm({ roomId: roomFilter, dayOfWeek, startHour: hour, endHour: Math.min(24, hour + 1) });
  };

  const openEditForm = (schedule) => {
    setEditingSchedule(schedule);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    pageData.reload();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await schedulesApi.remove(scheduleToDelete.id);
      toast.success('Class deleted', `${scheduleToDelete.courseName} was removed from the timetable.`);
      setScheduleToDelete(null);
      pageData.reload();
    } catch (error) {
      toast.error('Could not delete the class', error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Render
  return (
    <PageContainer
      title="Manage schedules"
      description="Weekly class sessions per room. Waste is energy used while no class is scheduled."
      actions={<Button icon={Plus} onClick={() => openAddForm()} disabled={!allRooms.length}>Add class</Button>}
    >
      <ManageTabs />

      {/* Filters */}
      <Card className="flex flex-wrap items-end gap-4 p-5">
        <div className="w-full sm:w-60">
          <label htmlFor="schedule-building-filter" className="label">Building</label>
          <select id="schedule-building-filter" className="select" value={buildingFilter} onChange={(event) => changeBuilding(event.target.value)}>
            <option value="all">All buildings</option>
            {buildings.map((building) => <option key={building.id} value={building.id}>{building.code} · {building.name}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-72">
          <label htmlFor="schedule-room-filter" className="label">Room</label>
          <select id="schedule-room-filter" className="select" value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)}>
            <option value="all">All rooms</option>
            {roomsInBuilding.map((room) => <option key={room.id} value={room.id}>{room.code} · {room.name}</option>)}
          </select>
        </div>
      </Card>

      {/* Weekly grid */}
      <Card>
        <CardHeader
          title={selectedRoom ? `Weekly timetable · ${selectedRoom.name}` : 'Weekly timetable'}
          subtitle={selectedRoom ? `${selectedRoom.code} · ${selectedRoomSchedules.length} class sessions per week` : 'Choose a room above to see its week.'}
          icon={CalendarDays}
        />
        <div className="p-5">
          {pageData.loading && !pageData.data && <TableSkeleton rows={4} />}
          {pageData.data && !selectedRoom && (
            <EmptyState icon={CalendarDays} title="No room selected" description="Pick a room to see a days by hours grid. Click an empty cell to add a class." />
          )}
          {selectedRoom && <WeeklyScheduleGrid schedules={selectedRoomSchedules} onAdd={openAddFromGrid} onEdit={openEditForm} />}
        </div>
      </Card>

      {/* List */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <SearchInput id="schedule-search" value={searchText} onChange={setSearchText} placeholder="Search by course or room" label="Search classes" />
          {pageData.data && <p className="tabular text-sm text-ink-secondary">{visibleSchedules.length} of {allSchedules.length} classes</p>}
        </div>

        {pageData.loading && !pageData.data && <TableSkeleton />}
        {pageData.error && !pageData.data && <ErrorState error={pageData.error} onRetry={pageData.retry} />}
        {pageData.data && allSchedules.length === 0 && (
          <EmptyState icon={CalendarDays} title="No classes scheduled" description="Without classes, every hour of high usage counts as waste." />
        )}
        {pageData.data && allSchedules.length > 0 && visibleSchedules.length === 0 && (
          <EmptyState icon={SearchX} title="No classes match these filters" description="Try another building, room or search word." />
        )}
        {visibleSchedules.length > 0 && (
          <div className="max-h-[65vh] overflow-auto scrollbar-thin">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Time</th>
                  <th scope="col">Course</th>
                  <th scope="col">Room</th>
                  <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleSchedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="font-medium">{schedule.dayName}</td>
                    <td className="tabular text-ink-secondary">{formatHourRange(schedule.startHour, schedule.endHour)}</td>
                    <td className="font-semibold">{schedule.courseName}</td>
                    <td className="text-ink-secondary">{schedule.roomCode} · {schedule.roomName}</td>
                    <td>
                      <RowActions itemName={schedule.courseName} onEdit={() => openEditForm(schedule)} onDelete={() => setScheduleToDelete(schedule)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ScheduleFormModal
        open={formOpen}
        schedule={editingSchedule}
        prefill={formPrefill}
        rooms={allRooms}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
      <ConfirmDialog
        open={Boolean(scheduleToDelete)}
        title={scheduleToDelete ? `Delete ${scheduleToDelete.courseName}?` : 'Delete class?'}
        message={scheduleToDelete ? `${scheduleToDelete.courseName} on ${scheduleToDelete.dayName}, ${formatHourRange(scheduleToDelete.startHour, scheduleToDelete.endHour)} in ${scheduleToDelete.roomCode} will be removed. Only this class session is deleted.` : ''}
        confirmLabel="Delete class"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setScheduleToDelete(null)}
      />
    </PageContainer>
  );
}
