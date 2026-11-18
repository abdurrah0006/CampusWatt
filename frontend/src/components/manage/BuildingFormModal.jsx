import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { FormField } from '../ui/FormField.jsx';
import { buildingsApi } from '../../api/endpoints.js';
import { useToast } from '../../hooks/useToast.js';
import { hasErrors, mapServerFieldErrors, validateBuildingForm } from '../../utils/formValidation.js';

const EMPTY_BUILDING = { code: '', name: '', floors: '3', thresholdKwhPerHour: '100' };

// Form helpers
function toFormValues(building) {
  if (!building) return { ...EMPTY_BUILDING };
  return {
    code: building.code,
    name: building.name,
    floors: String(building.floors),
    thresholdKwhPerHour: String(building.thresholdKwhPerHour),
  };
}

function toRequestBody(form) {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    floors: Number(form.floors),
    thresholdKwhPerHour: Number(form.thresholdKwhPerHour),
  };
}

export function BuildingFormModal({ open, building, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_BUILDING);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(building);

  useEffect(() => {
    if (!open) return;
    setForm(toFormValues(building));
    setErrors({});
  }, [open, building]);

  // Handlers
  const updateField = (fieldName, value) => {
    setForm((previous) => ({ ...previous, [fieldName]: value }));
    setErrors((previous) => ({ ...previous, [fieldName]: undefined }));
  };

  const saveBuilding = async () => {
    if (isEditing) return buildingsApi.update(building.id, toRequestBody(form));
    return buildingsApi.create(toRequestBody(form));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formErrors = validateBuildingForm(form);
    setErrors(formErrors);
    if (hasErrors(formErrors)) return;

    setSaving(true);
    try {
      const saved = await saveBuilding();
      toast.success(isEditing ? 'Building updated' : 'Building added', `${saved.name} (${saved.code}) was saved.`);
      onSaved();
    } catch (error) {
      setErrors(mapServerFieldErrors(error));
      toast.error('Could not save the building', error.message);
    } finally {
      setSaving(false);
    }
  };

  // Render
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
      <Button type="submit" form="building-form" icon={Save} loading={saving}>{isEditing ? 'Save changes' : 'Add building'}</Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? `Edit ${building.name}` : 'Add building'} description="Each building has an hourly energy limit used for alerts." footer={footer}>
      <form id="building-form" onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField id="building-code" label="Code" error={errors.code} hint="2 to 6 letters or numbers">
          <input id="building-code" className={`input uppercase ${errors.code ? 'input-invalid' : ''}`} value={form.code} onChange={(event) => updateField('code', event.target.value)} aria-invalid={Boolean(errors.code)} aria-describedby="building-code-message" maxLength={6} />
        </FormField>
        <FormField id="building-floors" label="Floors" error={errors.floors}>
          <input id="building-floors" type="number" min="1" max="30" className={`input tabular ${errors.floors ? 'input-invalid' : ''}`} value={form.floors} onChange={(event) => updateField('floors', event.target.value)} aria-invalid={Boolean(errors.floors)} aria-describedby="building-floors-message" />
        </FormField>
        <div className="sm:col-span-2">
          <FormField id="building-name" label="Name" error={errors.name}>
            <input id="building-name" className={`input ${errors.name ? 'input-invalid' : ''}`} value={form.name} onChange={(event) => updateField('name', event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby="building-name-message" maxLength={120} />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <FormField id="building-threshold" label="Hourly limit (kWh per hour)" error={errors.thresholdKwhPerHour} hint="Alerts start at 90% of this limit.">
            <input id="building-threshold" type="number" min="0" step="0.1" className={`input tabular ${errors.thresholdKwhPerHour ? 'input-invalid' : ''}`} value={form.thresholdKwhPerHour} onChange={(event) => updateField('thresholdKwhPerHour', event.target.value)} aria-invalid={Boolean(errors.thresholdKwhPerHour)} aria-describedby="building-threshold-message" />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
