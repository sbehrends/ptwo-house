export const names = ['Bob', 'Alice', 'John', 'Craig', 'Mike', 'Jack', 'Barb']
export default function randomName() {
  return names[Math.floor(Math.random() * names.length)]
}
