const colors = [
  '#9199DF',
  '#DF7F7F',
  '#EEA67B',
  '#EAE869',
  '#6CD8F9',
  '#97EEB9',
  '#F18DE6',
  '#FF7070'
];

export function getColorForName(name: string): string {
  const colorIndex =
    [...name].reduce((acc, a) => acc + a.charCodeAt(0), 0) % colors.length;
  return colors[colorIndex];
};
