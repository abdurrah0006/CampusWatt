import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { FormField } from '../ui/FormField.jsx';
import { schedulesApi } from '../../api/endpoints.js';
import { useToast } from '../../hooks/useToast.js';
import { DAY_NAMES } from '../../utils/constants.js';
import { hasErrors, mapServerFieldErrors, validateScheduleForm } from '../../utils/formValidation.js';

const START_HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const END_HOURS = Array.from({ length: 24 }, (_, index) => index + 1);

// Form helpers
function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function toFormValues(schedule, prefill) {
  if (schedule) {
    return {
      roomId: schedule.roomId,
      dayOfWeek: String(schedule.dayOfWeek),
      startHour: String(schedule.startHour),
      endHour: String(schedule.endHour),
      courseName: schedule.courseName,
    };
  }
  return {
    roomId: prefill?.roomId || '',
    dayOfWeek: String(prefill?.dayOfWeek ?? 0),
    startHour: String(prefill?.startHour ?? 8),
    endHour: String(prefill?.endHour ?? 10),
    courseName: '',
  };
}

function toRequestBody(form) {
  return {
    roomId: form.roomId,
    dayOfWeek: Number(form.dayOfWeek),
    startHour: Number(form.startHour),
    endHour: Number(form.endHour),
    courseName: form.courseName.trim(),
  };
}

export function ScheduleFormModal({ open, schedule, prefill, rooms, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() => toFormValues(null, null));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(schedule);

  useEffect(() => {
    if (!open) return;
    setForm(toFormValues(schedule, prefill));
    setErrors({});
  }, [open, schedule, prefill]);

  // Handlers
  const updateField = (fieldName, value) => {
    setForm((previous) => ({ ...previous, [fieldName]: value }));
    setErrors((previous) => ({ ...previous, [fieldName]: undefined }));
  };

  const saveSchedule = async () => {
    if (isEditing) return schedulesApi.update(schedule.id, toRequestBody(form));
    return schedulesApi.create(toRequestBody(form));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formErrors = validateScheduleForm(form);
    setErrors(formErrors);
    if (hasErrors(formErrors)) return;

    setSaving(true);
    try {
      const saved = await saveSchedule();
      toast.success(isEditing ? 'Class updated' : 'Class added', `${saved.courseName} was saved.`);
      onSaved();
    } catch (error) {
      const fieldErrors = mapServerFieldErrors(error);
      if (error.status === 409) fieldErrors.startHour = error.message;
      setErrors(fieldErrors);
      toast.error('Could not save the class', error.message);
    } finally {
      setSaving(false);
    }
  };

  // Render
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
      <Button type="submit" form="schedule-form" icon={Save} loading={saving}>{isEditing ? 'Save changes' : 'Add class'}</Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit class session' : 'Add class session'} description="Classes in the same room cannot overlap. Times are campus time (UAE)." footer={footer}>
      <form id="schedule-form" onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField id="schedule-course" label="Course name" error={errors.courseName}>
            <input id="schedule-course" className={`input ${errors.courseName ? 'input-invalid' : ''}`} value={form.courseName} onChange={(event) => updateField('courseName', event.target.value)} aria-invalid={Boolean(errors.courseName)} aria-describedby="schedule-course-message" maxLength={120} />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <FormField id="schedule-room" label="Room" error={errors.roomId}>
            <select id="schedule-room" className={`select ${errors.roomId ? 'input-invalid' : ''}`} value={form.roomId} onChange={(event) => updateField('roomId', event.target.value)} aria-invalid={Boolean(errors.roomId)} aria-describedby="schedule-room-message">
              <option value="">Choose a room</option>
              {rooms.map((room) => <option key={room.id} value={room.id}>{room.code} · {room.name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField id="schedule-day" label="Day" error={errors.dayOfWeek}>
          <select id="schedule-day" className="select" value={form.dayOfWeek} onChange={(event) => updateField('dayOfWeek', event.target.value)}>
            {DAY_NAMES.map((dayName, dayIndex) => <option key={dayName} value={dayIndex}>{dayName}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField id="schedule-start" label="Start" error={errors.startHour}>
            <select id="schedule-start" className={`select tabular ${errors.startHour ? 'input-invalid' : ''}`} value={form.startHour} onChange={(event) => updateField('startHour', event.target.value)} aria-describedby="schedule-start-message">
              {START_HOURS.map((hour) => <option key={hour} value={hour}>{formatHourLabel(hour)}</option>)}
            </select>
          </FormField>
          <FormField id="schedule-end" label="End" error={errors.endHour}>
            <select id="schedule-end" className={`select tabular ${errors.endHour ? 'input-invalid' : ''}`} value={form.endHour} onChange={(event) => updateField('endHour', event.target.value)} aria-describedby="schedule-end-message">
              {END_HOURS.map((hour) => <option key={hour} value={hour}>{formatHourLabel(hour)}</option>)}
            </select>
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
