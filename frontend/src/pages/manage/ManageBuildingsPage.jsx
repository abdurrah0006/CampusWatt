import { useState } from 'react';
import { Plus, SearchX, Warehouse } from 'lucide-react';
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
import { BuildingFormModal } from '../../components/manage/BuildingFormModal.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../hooks/useToast.js';
import { buildingsApi } from '../../api/endpoints.js';
import { formatNumber } from '../../utils/formatters.js';

// Helpers
function matchesSearch(building, searchText) {
  const text = searchText.trim().toLowerCase();
  if (!text) return true;
  return `${building.code} ${building.name}`.toLowerCase().includes(text);
}

function buildDeleteMessage(building) {
  if (!building) return '';
  if (building.roomCount > 0) {
    return `${building.name} (${building.code}) still has ${building.roomCount} room(s). Deleting it will also delete those rooms, their class schedules and their readings. This cannot be undone.`;
  }
  return `Delete ${building.name} (${building.code})? This cannot be undone.`;
}

export default function ManageBuildingsPage() {
  const toast = useToast();
  const buildings = useApi(() => buildingsApi.list(), []);
  const [searchText, setSearchText] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingToDelete, setBuildingToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const allBuildings = buildings.data || [];
  const visibleBuildings = allBuildings.filter((building) => matchesSearch(building, searchText));

  // Handlers
  const openAddForm = () => {
    setEditingBuilding(null);
    setFormOpen(true);
  };

  const openEditForm = (building) => {
    setEditingBuilding(building);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    buildings.reload();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const hasRooms = buildingToDelete.roomCount > 0;
      await buildingsApi.remove(buildingToDelete.id, { cascade: hasRooms });
      toast.success('Building deleted', `${buildingToDelete.name} was removed.`);
      setBuildingToDelete(null);
      buildings.reload();
    } catch (error) {
      toast.error('Could not delete the building', error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Render
  return (
    <PageContainer
      title="Manage buildings"
      description="Add, edit or remove campus buildings and their hourly energy limits."
      actions={<Button icon={Plus} onClick={openAddForm}>Add building</Button>}
    >
      <ManageTabs />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <SearchInput id="building-search" value={searchText} onChange={setSearchText} placeholder="Search by code or name" label="Search buildings" />
          {buildings.data && <p className="tabular text-sm text-ink-secondary">{visibleBuildings.length} of {allBuildings.length} buildings</p>}
        </div>

        {buildings.loading && !buildings.data && <TableSkeleton />}
        {buildings.error && !buildings.data && <ErrorState error={buildings.error} onRetry={buildings.retry} />}
        {buildings.data && allBuildings.length === 0 && (
          <EmptyState icon={Warehouse} title="No buildings yet" description="Add your first building to start tracking energy." action={<Button icon={Plus} onClick={openAddForm}>Add building</Button>} />
        )}
        {buildings.data && allBuildings.length > 0 && visibleBuildings.length === 0 && (
          <EmptyState icon={SearchX} title="No buildings match your search" description="Try a different code or name." />
        )}
        {visibleBuildings.length > 0 && (
          <div className="max-h-[65vh] overflow-auto scrollbar-thin">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Name</th>
                  <th scope="col" className="numeric">Floors</th>
                  <th scope="col" className="numeric">Hourly limit (kWh)</th>
                  <th scope="col" className="numeric">Rooms</th>
                  <th scope="col" className="text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleBuildings.map((building) => (
                  <tr key={building.id}>
                    <td className="font-semibold">{building.code}</td>
                    <td>{building.name}</td>
                    <td className="numeric">{building.floors}</td>
                    <td className="numeric">{formatNumber(building.thresholdKwhPerHour, 1)}</td>
                    <td className="numeric">{building.roomCount}</td>
                    <td>
                      <RowActions itemName={building.name} onEdit={() => openEditForm(building)} onDelete={() => setBuildingToDelete(building)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <BuildingFormModal open={formOpen} building={editingBuilding} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      <ConfirmDialog
        open={Boolean(buildingToDelete)}
        title={buildingToDelete ? `Delete ${buildingToDelete.name}?` : 'Delete building?'}
        message={buildDeleteMessage(buildingToDelete)}
        confirmLabel={buildingToDelete?.roomCount > 0 ? 'Delete building and rooms' : 'Delete building'}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setBuildingToDelete(null)}
      />
    </PageContainer>
  );
}
