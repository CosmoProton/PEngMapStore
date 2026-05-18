import { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '../hooks/useAuth.jsx';

export default function TasksStudent() {

  const { user, loading } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {

    if (loading) return;

    async function fetchTasks() {

      try {

        const studentNik = user?.github_username;

        console.log("USER:", user);
        console.log("studentNik:", studentNik);

        if (!studentNik) {
          setTasks([]);
          setFetching(false);
          return;
        }

        const data = await apiFetch(
          `/api/tasks?action=student&userNik=${encodeURIComponent(studentNik)}`
        );

        console.log("TASKS:", data);

        setTasks(Array.isArray(data) ? data : []);

      } catch (err) {

        console.error(err);
        setTasks([]);

      } finally {

        setFetching(false);

      }
    }

    fetchTasks();

  }, [user, loading]);

  if (loading || fetching) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 40 }}>

      <h1>Student Tasks</h1>

      <pre>
        {JSON.stringify(user, null, 2)}
      </pre>

      <hr />

      {tasks.length === 0 ? (
        <div>Nessun task trovato</div>
      ) : (
        tasks.map(task => (
          <div
            key={task.id}
            style={{
              border: '1px solid #444',
              padding: 20,
              marginBottom: 20
            }}
          >
            <h2>{task.title}</h2>

            <div>{task.description}</div>

            <div>
              Deadline:
              {' '}
              {new Date(task.deadline).toLocaleString()}
            </div>

            <pre>
              {JSON.stringify(task, null, 2)}
            </pre>

          </div>
        ))
      )}

    </div>
  );
}
