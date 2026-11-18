import { useCallback, useMemo, useState } from 'react';
import { Lightbulb, ListFilter, ScanSearch, Sparkles } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Card } from '../components/ui/Card.jsx';
import { CardHeader } from '../components/ui/CardHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { CardSkeleton } from '../components/ui/CardSkeleton.jsx';
import { TableSkeleton } from '../components/ui/TableSkeleton.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SavingsBanner } from '../components/waste/SavingsBanner.jsx';
import { RoomsTable } from '../components/waste/RoomsTable.jsx';
import { RecommendationPanel } from '../components/waste/RecommendationPanel.jsx';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../hooks/useToast.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { recommendationsApi, wasteApi } from '../api/endpoints.js';
import { formatDateTime, formatTime } from '../utils/formatters.js';

const MIN_LOADING_MS = 900;

// Helpers
function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getBuildingOptions(rooms) {
  const namesById = new Map();
  rooms.forEach((room) => namesById.set(room.buildingId, room.buildingName));
  return [...namesById.entries()].sort((entryA, entryB) => String(entryA[1]).localeCompare(String(entryB[1])));
}

function matchesFilters(room, buildingFilter, statusFilter, searchText) {
  if (buildingFilter !== 'all' && room.buildingId !== buildingFilter) return false;
  if (statusFilter !== 'all' && room.status !== statusFilter) return false;
  const text = searchText.trim().toLowerCase();
  if (!text) return true;
  return `${room.roomName} ${room.roomCode}`.toLowerCase().includes(text);
}

function buildDescription(data) {
  if (!data?.window) return 'Rooms using energy while nothing is scheduled (simulated data).';
  return `Rooms using energy while nothing is scheduled · simulated data from ${formatDateTime(data.window.from)} → ${formatTime(data.window.to)} (last ${data.assumptions.windowHours}h)`;
}

function getGenerateLabel(generating, recommendations) {
  if (generating) return 'Analysing rooms…';
  if (recommendations) return 'Regenerate Recommendations';
  return 'Generate Recommendations';
}

export default function WasteFinderPage() {
  const { tariff } = useSettings();
  const toast = useToast();
  const waste = useApi(() => wasteApi.list({ tariff }), [tariff]);

  const [buildingFilter, setBuildingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [focusRoomId, setFocusRoomId] = useState(null);

  const data = waste.data;
  const rooms = useMemo(() => (data?.rooms || []).map((room) => ({ ...room, aed: room.monthlySavingsKwh * tariff })), [data, tariff]);
  const flaggedRooms = rooms.filter((room) => room.flagged);
  const buildingOptions = useMemo(() => getBuildingOptions(rooms), [rooms]);
  const visibleRooms = rooms.filter((room) => matchesFilters(room, buildingFilter, statusFilter, searchText));
  const hasFilters = buildingFilter !== 'all' || statusFilter !== 'all' || searchText;

  const recommendationsByRoom = useMemo(() => {
    const byRoom = {};
    (recommendations?.items || []).forEach((item) => {
      byRoom[item.roomId] = item;
    });
    return byRoom;
  }, [recommendations]);

  // Handlers
  const generateRecommendations = useCallback(async () => {
    if (!flaggedRooms.length) return;
    setGenerating(true);
    const startTime = Date.now();
    try {
      const result = await recommendationsApi.generate({ roomIds: flaggedRooms.map((room) => room.roomId), tariff });
      const remaining = MIN_LOADING_MS - (Date.now() - startTime);
      if (remaining > 0) await wait(remaining);
      setRecommendations(result);
      setFocusRoomId(null);
      setPanelOpen(true);
      toast.success('Recommendations ready', `${result.items.length} rooms have a specific action to take.`);
    } catch (error) {
      toast.error('Could not generate recommendations', error.message);
    } finally {
      setGenerating(false);
    }
  }, [flaggedRooms, tariff, toast]);

  const clearFilters = () => {
    setBuildingFilter('all');
    setStatusFilter('all');
    setSearchText('');
  };

  const showRoomTip = (roomId) => {
    setFocusRoomId(roomId);
    setPanelOpen(true);
  };

  const openPanel = () => {
    setFocusRoomId(null);
    setPanelOpen(true);
  };

  // Render
  if (waste.error && !data) {
    return (
      <PageContainer title="Waste Finder">
        <Card><ErrorState error={waste.error} onRetry={waste.retry} /></Card>
      </PageContainer>
    );
  }

  const loading = waste.loading && !data;
  const generateButton = (
    <Button size="lg" icon={generating ? undefined : Sparkles} loading={generating} onClick={generateRecommendations} disabled={!flaggedRooms.length} className="w-full whitespace-nowrap lg:w-auto">
      {getGenerateLabel(generating, recommendations)}
    </Button>
  );

  return (
    <PageContainer
      title="Waste Finder"
      description={buildDescription(data)}
      actions={recommendations && !panelOpen ? <Button variant="secondary" icon={Lightbulb} onClick={openPanel}>View recommendations ({recommendations.items.length})</Button> : null}
    >
      {/* Savings */}
      {loading && <CardSkeleton lines={3} />}
      {!loading && (
        <SavingsBanner
          monthlyAED={data.totals.monthlySavingsKwh * tariff}
          monthlyKwh={data.totals.monthlySavingsKwh}
          flaggedRooms={data.totals.flaggedRooms}
          totalRooms={data.totals.totalRooms}
          tariff={tariff}
          action={flaggedRooms.length ? generateButton : null}
        />
      )}

      {/* Rooms */}
      <Card>
        <CardHeader
          title="Rooms"
          subtitle={data ? `${flaggedRooms.length} flagged · rule: usage > ${data.assumptions.highUsageMultiplier}× baseline with no class booked, for ${data.assumptions.minWasteHours}+ hours` : 'Loading rooms…'}
          icon={ScanSearch}
        />
        <div className="flex flex-wrap items-center gap-3 px-5 pb-4 pt-4">
          <SearchInput id="waste-room-search" value={searchText} onChange={setSearchText} placeholder="Room name or code" label="Search rooms" />
          <div className="w-full sm:w-52">
            <label htmlFor="building-filter" className="sr-only">Building</label>
            <select id="building-filter" className="select" value={buildingFilter} onChange={(event) => setBuildingFilter(event.target.value)}>
              <option value="all">All buildings</option>
              {buildingOptions.map(([buildingId, buildingName]) => <option key={buildingId} value={buildingId}>{buildingName}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label htmlFor="status-filter" className="sr-only">Status</label>
            <select id="status-filter" className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="waste">Waste</option>
              <option value="ok">OK</option>
            </select>
          </div>
          {hasFilters && <Button variant="ghost" icon={ListFilter} onClick={clearFilters}>Clear</Button>}
          <p className="tabular ml-auto text-sm text-ink-secondary">{data ? `${visibleRooms.length} of ${rooms.length} rooms` : ''}</p>
        </div>

        {loading && <TableSkeleton rows={8} />}
        {!loading && rooms.length === 0 && (
          <EmptyState icon={ScanSearch} title="No rooms yet" description="Add rooms under Manage → Rooms to start finding waste." />
        )}
        {!loading && rooms.length > 0 && (
          <RoomsTable rooms={visibleRooms} recommendationsByRoom={recommendationsByRoom} onShowRecommendation={showRoomTip} onClearFilters={clearFilters} />
        )}
      </Card>

      <RecommendationPanel open={panelOpen} onClose={() => setPanelOpen(false)} result={recommendations} tariff={tariff} focusRoomId={focusRoomId} />
    </PageContainer>
  );
}
