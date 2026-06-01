const tasks = [
  "Define the project brief and target audience.",
  "Decide whether this hub should be a website, app, docs portal, or mixed workspace.",
  "Choose the initial content model and publishing workflow.",
  "Add setup and deployment instructions."
];

export default function TasksPage() {
  return (
    <main className="shell">
      <section className="intro">
        <p className="eyebrow">Backlog</p>
        <h1>Initial Tasks</h1>
        <div className="panel">
          <ul>
            {tasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
