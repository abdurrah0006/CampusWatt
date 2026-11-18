import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { FormField } from '../ui/FormField.jsx';
import { roomsApi } from '../../api/endpoints.js';
import { useToast } from '../../hooks/useToast.js';
import { ROOM_TYPES } from '../../utils/constants.js';
import { hasErrors, mapServerFieldErrors, validateRoomForm } from '../../utils/formValidation.js';

const EMPTY_ROOM = { code: '', name: '', buildingId: '', floor: '1', type: 'lecture_hall', areaM2: '100', baselineKw: '2' };

// Form helpers
function toFormValues(room, defaultBuildingId) {
  if (!room) return { ...EMPTY_ROOM, buildingId: defaultBuildingId || '' };
  return {
    code: room.code,
    name: room.name,
    buildingId: room.buildingId,
    floor: String(room.floor),
    type: room.type,
    areaM2: String(room.areaM2),
    baselineKw: String(room.baselineKw),
  };
}

function toRequestBody(form) {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    buildingId: form.buildingId,
    floor: Number(form.floor),
    type: form.type,
    areaM2: Number(form.areaM2),
    baselineKw: Number(form.baselineKw),
  };
}

export function RoomFormModal({ open, room, buildings, defaultBuildingId, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_ROOM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(room);

  useEffect(() => {
    if (!open) return;
    setForm(toFormValues(room, defaultBuildingId));
    setErrors({});
  }, [open, room, defaultBuildingId]);

  // Handlers
  const updateField = (fieldName, value) => {
    setForm((previous) => ({ ...previous, [fieldName]: value }));
    setErrors((previous) => ({ ...previous, [fieldName]: undefined }));
  };

  const saveRoom = async () => {
    if (isEditing) return roomsApi.update(room.id, toRequestBody(form));
    return roomsApi.create(toRequestBody(form));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formErrors = validateRoomForm(form);
    setErrors(formErrors);
    if (hasErrors(formErrors)) return;

    setSaving(true);
    try {
      const saved = await saveRoom();
      toast.success(isEditing ? 'Room updated' : 'Room added', `${saved.name} (${saved.code}) was saved.`);
      onSaved();
    } catch (error) {
      setErrors(mapServerFieldErrors(error));
      toast.error('Could not save the room', error.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (fieldName) => `input ${errors[fieldName] ? 'input-invalid' : ''}`;
  const selectClass = (fieldName) => `select ${errors[fieldName] ? 'input-invalid' : ''}`;

  // Render
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
      <Button type="submit" form="room-form" icon={Save} loading={saving}>{isEditing ? 'Save changes' : 'Add room'}</Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? `Edit ${room.name}` : 'Add room'} description="A room can be a classroom, lab, office, library or server room." footer={footer}>
      <form id="room-form" onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField id="room-code" label="Code" error={errors.code} hint="For example ENG-101">
          <input id="room-code" className={`${inputClass('code')} uppercase`} value={form.code} onChange={(event) => updateField('code', event.target.value)} aria-invalid={Boolean(errors.code)} aria-describedby="room-code-message" maxLength={20} />
        </FormField>
        <FormField id="room-type" label="Type" error={errors.type}>
          <select id="room-type" className={selectClass('type')} value={form.type} onChange={(event) => updateField('type', event.target.value)} aria-describedby="room-type-message">
            {ROOM_TYPES.map((roomType) => <option key={roomType.value} value={roomType.value}>{roomType.label}</option>)}
          </select>
        </FormField>
        <div className="sm:col-span-2">
          <FormField id="room-name" label="Name" error={errors.name}>
            <input id="room-name" className={inputClass('name')} value={form.name} onChange={(event) => updateField('name', event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby="room-name-message" maxLength={120} />
          </FormField>
        </div>
        <FormField id="room-building" label="Building" error={errors.buildingId}>
          <select id="room-building" className={selectClass('buildingId')} value={form.buildingId} onChange={(event) => updateField('buildingId', event.target.value)} aria-invalid={Boolean(errors.buildingId)} aria-describedby="room-building-message">
            <option value="">Choose a building</option>
            {buildings.map((building) => <option key={building.id} value={building.id}>{building.code} · {building.name}</option>)}
          </select>
        </FormField>
        <FormField id="room-floor" label="Floor" error={errors.floor}>
          <input id="room-floor" type="number" className={`${inputClass('floor')} tabular`} value={form.floor} onChange={(event) => updateField('floor', event.target.value)} aria-invalid={Boolean(errors.floor)} aria-describedby="room-floor-message" />
        </FormField>
        <FormField id="room-area" label="Area (m²)" error={errors.areaM2}>
          <input id="room-area" type="number" min="0" className={`${inputClass('areaM2')} tabular`} value={form.areaM2} onChange={(event) => updateField('areaM2', event.target.value)} aria-invalid={Boolean(errors.areaM2)} aria-describedby="room-area-message" />
        </FormField>
        <FormField id="room-baseline" label="Baseline power (kW)" error={errors.baselineKw} hint="Normal draw when the room is idle.">
          <input id="room-baseline" type="number" min="0" step="0.1" className={`${inputClass('baselineKw')} tabular`} value={form.baselineKw} onChange={(event) => updateField('baselineKw', event.target.value)} aria-invalid={Boolean(errors.baselineKw)} aria-describedby="room-baseline-message" />
        </FormField>
      </form>
      {!isEditing && (
        <p className="mt-4 rounded-lg bg-elevated px-3 py-2 text-xs text-ink-secondary">
          New rooms start with no readings, so they show "No data yet". Readings arrive through POST /api/energy/ingest.
        </p>
      )}
    </Modal>
  );
}
