export function timePlugin() {
  return {
    name: 'timePlugin',
    getSegment: () => {
      const now = new Date();
      return `🕒 ${now.toLocaleTimeString()}`;
    },
  };
}
