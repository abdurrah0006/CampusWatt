export function findOverlappingBlock(existingBlocks, candidate, ignoreId = null) {
  return existingBlocks.find((block) => {
    if (block.id === ignoreId) {
      return false;
    }
    if (block.dayOfWeek !== candidate.dayOfWeek) {
      return false;
    }
    return candidate.startHour < block.endHour && block.startHour < candidate.endHour;
  }) || null;
}

export function formatHourRange(startHour, endHour) {
  return `${startHour}:00 to ${endHour}:00`;
}
