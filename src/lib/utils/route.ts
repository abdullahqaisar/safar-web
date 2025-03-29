// Get a color for a line
export const getLineColor = (lineId: string): string => {
  switch (lineId) {
    case 'red':
      return '#E53E3E';
    case 'green':
      return '#38A169';
    case 'blue':
      return '#3182CE';
    case 'orange':
      return '#ED8936';
    default:
      return lineId.startsWith('fr_') ? '#0D9488' : '#4A5568';
  }
};
