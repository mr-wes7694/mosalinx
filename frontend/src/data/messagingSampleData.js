// DEMONSTRATION CONTENT ONLY.
// Everything below is made-up sample data for the Messaging prototype. It is
// not loaded from, and never written to, a backend. Swapping this module for
// API calls later only requires keeping the same shapes:
//   project  { id, name, short, color, members[], conversations[] }
//   convo    { id, kind: 'channel' | 'dm', name, topic, unread, messages[] }
//   message  { id, author (member id), at (ISO), text, pinned?, replyTo?, reactions[] }

// A timestamp `daysAgo` days back at the given clock time, so the sample
// history always reads "Today" / "Yesterday" no matter when it is opened.
function ago(daysAgo, hour, minute) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

const react = (emoji, count, mine = false) => ({ emoji, count, mine })

// Shared cast of fictional people. Projects pick which of them are members.
const PEOPLE = {
  alex: { id: 'alex', name: 'Alex Rivera', role: 'Scrum Master', color: '#e4572e', status: 'online' },
  priya: { id: 'priya', name: 'Priya Shah', role: 'Frontend', color: '#8e6bd6', status: 'online' },
  marcus: { id: 'marcus', name: 'Marcus Lee', role: 'Backend', color: '#2e9e6b', status: 'idle' },
  dana: { id: 'dana', name: 'Dana Brooks', role: 'Design', color: '#d9a21b', status: 'offline' },
  sam: { id: 'sam', name: 'Sam Okafor', role: 'QA', color: '#3b82c4', status: 'online' },
}

// The signed-in user is always "me" in every project.
export const ME = { id: 'me', name: 'You', role: 'Member', color: '#14bbc4', status: 'online' }

const team = (...ids) => [ME, ...ids.map((id) => PEOPLE[id])]

export const SAMPLE_PROJECTS = [
  {
    id: 'capstone',
    name: 'Sample: Capstone Team',
    short: 'CT',
    color: '#14bbc4',
    members: team('alex', 'priya', 'marcus', 'dana', 'sam'),
    conversations: [
      {
        id: 'capstone-general',
        kind: 'channel',
        name: 'general',
        topic: 'Team-wide updates and quick questions',
        unread: 0,
        messages: [
          { id: 'c1', author: 'alex', at: ago(2, 9, 2), text: 'Morning all! Sprint review is Friday at 2pm. Please have your demos ready.', pinned: true, reactions: [react('👍', 4, true)] },
          { id: 'c2', author: 'priya', at: ago(2, 9, 10), text: 'Dashboard board is looking good. I will have the tile styles finished before the review.', reactions: [react('🎉', 2)] },
          { id: 'c3', author: 'priya', at: ago(2, 9, 11), text: 'Also, does anyone have the latest logo files?', reactions: [] },
          { id: 'c4', author: 'dana', at: ago(2, 9, 30), text: 'Pinned in #design-review. The teal is #14bbc4 everywhere.', replyTo: 'c3', reactions: [react('🙏', 1)] },
          { id: 'c5', author: 'marcus', at: ago(1, 14, 5), text: 'Heads up: I am merging the calendar endpoint changes tonight. Pull main before you start tomorrow.', reactions: [react('👀', 3, true)] },
          { id: 'c6', author: 'sam', at: ago(1, 16, 40), text: 'QA pass on the workspace feed is done. Two small issues logged, nothing blocking.', reactions: [react('✅', 2)] },
          { id: 'c7', author: 'alex', at: ago(0, 8, 55), text: 'Good morning! @Priya can you take the messaging UI ticket this sprint?', reactions: [] },
          { id: 'c8', author: 'priya', at: ago(0, 9, 3), text: 'On it. It is all sample data for now, no backend needed.', replyTo: 'c7', reactions: [react('👍', 1)] },
        ],
      },
      {
        id: 'capstone-sprint',
        kind: 'channel',
        name: 'sprint-planning',
        topic: 'Backlog grooming, estimates and ticket questions',
        unread: 3,
        messages: [
          { id: 's1', author: 'alex', at: ago(3, 13, 0), text: 'Sprint 15 candidates: messaging UI, dashboard polish, lint cleanup. Thoughts on sizing?', reactions: [] },
          { id: 's2', author: 'marcus', at: ago(3, 13, 12), text: 'Messaging UI is mostly frontend. I would call it a 5.', reactions: [react('👍', 2)] },
          { id: 's3', author: 'sam', at: ago(3, 13, 20), text: 'Lint cleanup is a 2 if we keep it to the files we already touched.', reactions: [] },
          { id: 's4', author: 'alex', at: ago(0, 10, 15), text: 'Locking the sprint. Tickets are assigned, check your board.', pinned: true, reactions: [react('🚀', 3)] },
          { id: 's5', author: 'dana', at: ago(0, 10, 22), text: 'Figma frames for messaging are linked on the ticket.', reactions: [] },
          { id: 's6', author: 'marcus', at: ago(0, 10, 40), text: 'Reminder that real-time delivery is out of scope. Keep it a prototype.', reactions: [react('💯', 2)] },
        ],
      },
      {
        id: 'capstone-frontend',
        kind: 'channel',
        name: 'frontend',
        topic: 'React, styling and component questions',
        unread: 0,
        messages: [
          { id: 'f1', author: 'priya', at: ago(1, 11, 0), text: 'Anyone else seeing the shell content scroll twice on short windows?', reactions: [] },
          { id: 'f2', author: 'sam', at: ago(1, 11, 14), text: 'Yes on my laptop. It is the padding on .shell-content.', reactions: [react('👀', 1)] },
          { id: 'f3', author: 'priya', at: ago(1, 11, 20), text: 'Thanks! I will override it per page like the dashboard does.', reactions: [react('👍', 2, true)] },
        ],
      },
      {
        id: 'capstone-design',
        kind: 'channel',
        name: 'design-review',
        topic: 'Mockups, brand assets and feedback',
        unread: 0,
        messages: [],
      },
      {
        id: 'capstone-dm-alex',
        kind: 'dm',
        name: 'Alex Rivera',
        peer: 'alex',
        topic: 'Direct message',
        unread: 1,
        messages: [
          { id: 'da1', author: 'alex', at: ago(1, 17, 5), text: 'Quick one: can you demo the bulletin board first on Friday?', reactions: [] },
          { id: 'da2', author: 'me', at: ago(1, 17, 9), text: 'Sure, happy to. I will keep it under five minutes.', reactions: [react('👍', 1)] },
          { id: 'da3', author: 'alex', at: ago(0, 9, 45), text: 'Perfect. Also thanks for the quick turnaround on the review changes.', reactions: [] },
        ],
      },
      {
        id: 'capstone-dm-dana',
        kind: 'dm',
        name: 'Dana Brooks',
        peer: 'dana',
        topic: 'Direct message',
        unread: 0,
        messages: [],
      },
    ],
  },
  {
    id: 'garden',
    name: 'Sample: Campus Garden',
    short: 'CG',
    color: '#2e9e6b',
    members: team('dana', 'sam', 'alex'),
    conversations: [
      {
        id: 'garden-announcements',
        kind: 'channel',
        name: 'announcements',
        topic: 'Volunteer news and schedule changes',
        unread: 0,
        messages: [
          { id: 'g1', author: 'dana', at: ago(4, 10, 0), text: 'Saturday planting day moves to 9am because of the forecast.', pinned: true, reactions: [react('🌱', 5, true)] },
          { id: 'g2', author: 'sam', at: ago(4, 10, 12), text: 'I can bring two extra wheelbarrows.', reactions: [react('🙌', 2)] },
          { id: 'g3', author: 'alex', at: ago(1, 12, 30), text: 'Gloves and seed packets are in the shed. Sign-in sheet is by the door.', reactions: [] },
        ],
      },
      {
        id: 'garden-volunteers',
        kind: 'channel',
        name: 'volunteers',
        topic: 'Shift swaps and sign-ups',
        unread: 2,
        messages: [
          { id: 'gv1', author: 'sam', at: ago(0, 8, 10), text: 'Can someone cover my Thursday watering shift?', reactions: [] },
          { id: 'gv2', author: 'dana', at: ago(0, 8, 31), text: 'I can take it. Put me down.', replyTo: 'gv1', reactions: [react('🙏', 1)] },
        ],
      },
      {
        id: 'garden-events',
        kind: 'channel',
        name: 'events',
        topic: 'Workshops and open days',
        unread: 0,
        messages: [],
      },
    ],
  },
  {
    id: 'podcast',
    name: 'Sample: Podcast Pilot',
    short: 'PP',
    color: '#d9a21b',
    members: team('priya', 'marcus'),
    conversations: [
      {
        id: 'podcast-general',
        kind: 'channel',
        name: 'general',
        topic: 'Episode planning',
        unread: 0,
        messages: [
          { id: 'p1', author: 'marcus', at: ago(5, 15, 0), text: 'Episode 1 outline is ready for comments.', reactions: [react('📝', 1)] },
          { id: 'p2', author: 'priya', at: ago(5, 15, 25), text: 'Love the cold open. Can we trim the intro by thirty seconds?', reactions: [] },
        ],
      },
    ],
  },
  {
    // A project with no conversations at all, to show the project-level empty state.
    id: 'newproj',
    name: 'Sample: Brand New Project',
    short: 'BN',
    color: '#8e6bd6',
    members: team(),
    conversations: [],
  },
]
