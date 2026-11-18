import { buildingColorVar } from '../../utils/constants.js';

export function BuildingChips({ buildings, value, onChange }) {
  const allCodes = buildings.map((building) => building.code);
  const options = [{ id: 'all', name: 'All buildings', code: null }, ...buildings];

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select building">
      {options.map((option) => {
        const isActive = value === option.id;
        const activeClass = isActive ? 'border-ink-primary bg-ink-primary text-canvas' : 'border-line bg-surface text-ink-secondary hover:text-ink-primary';
        return (
          <button key={option.id} type="button" role="radio" aria-checked={isActive} onClick={() => onChange(option.id)} className={`chip ${activeClass}`} title={option.name}>
            {option.code && <span className="h-2 w-2 rounded-full" style={{ background: buildingColorVar(option.code, allCodes) }} aria-hidden="true" />}
            {option.code || option.name}
          </button>
        );
      })}
    </div>
  );
}
