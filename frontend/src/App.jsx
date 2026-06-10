import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:8080'
const emptyTask = { title: '', description: '', completed: false }

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('task_session')
    return saved ? JSON.parse(saved) : null
  })
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState(emptyTask)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [loading, setLoading] = useState(false)

  const isLoggedIn = Boolean(session?.token)
  const authTitle = authMode === 'login' ? 'Login' : 'Register'
  const submitLabel = authMode === 'login' ? 'Login' : 'Create account'
  const taskSubmitLabel = editingId ? 'Update task' : 'Add task'

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.token}`,
    }),
    [session],
  )

  useEffect(() => {
    if (session) {
      localStorage.setItem('task_session', JSON.stringify(session))
      fetchTasks(session.token)
    } else {
      localStorage.removeItem('task_session')
      setTasks([])
    }
  }, [session])

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, options)
    const data = await response.json().catch(() => ({
      success: false,
      message: 'Server returned an invalid response',
    }))

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong')
    }

    return data
  }

  function showMessage(text, type = 'success') {
    setMessage(text)
    setMessageType(type)
  }

  function updateAuthField(event) {
    const { name, value } = event.target
    setAuthForm((current) => ({ ...current, [name]: value }))
  }

  function updateTaskField(event) {
    const { name, value, type, checked } = event.target
    setTaskForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function submitAuth(event) {
    event.preventDefault()
    setLoading(true)

    const path = authMode === 'login' ? '/api/auth/v1/login' : '/api/auth/v1/register'
    const body =
      authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm

    try {
      const result = await request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      setSession(result.data)
      showMessage(result.message)
      setAuthForm({ username: '', email: '', password: '' })
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function fetchTasks(token = session?.token) {
    if (!token) return

    try {
      const result = await request('/api/v1/tasks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setTasks(result.data || [])
    } catch (error) {
      showMessage(error.message, 'error')
    }
  }

  async function submitTask(event) {
    event.preventDefault()
    setLoading(true)

    const path = editingId ? `/api/v1/tasks/${editingId}` : '/api/v1/tasks'
    const method = editingId ? 'PUT' : 'POST'

    try {
      const result = await request(path, {
        method,
        headers: authHeaders,
        body: JSON.stringify(taskForm),
      })

      showMessage(result.message)
      setTaskForm(emptyTask)
      setEditingId(null)
      fetchTasks()
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(task) {
    setEditingId(task.id)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      completed: task.completed,
    })
    showMessage('Editing selected task')
  }

  function cancelEdit() {
    setEditingId(null)
    setTaskForm(emptyTask)
  }

  async function deleteTask(id) {
    setLoading(true)

    try {
      const result = await request(`/api/v1/tasks/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      showMessage(result.message)
      if (editingId === id) {
        cancelEdit()
      }
      fetchTasks()
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setSession(null)
    setTaskForm(emptyTask)
    setEditingId(null)
    showMessage('Logged out')
  }

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Task API Client</p>
          <h1>Simple Task Manager</h1>
        </div>
        {isLoggedIn && (
          <button className="secondary-button" type="button" onClick={logout}>
            Logout
          </button>
        )}
      </section>

      {message && <div className={`message ${messageType}`}>{message}</div>}

      {!isLoggedIn ? (
        <section className="auth-panel">
          <div className="mode-switch" aria-label="Authentication mode">
            <button
              className={authMode === 'login' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form className="form-card" onSubmit={submitAuth}>
            <h2>{authTitle}</h2>
            {authMode === 'register' && (
              <label>
                Username
                <input
                  name="username"
                  type="text"
                  value={authForm.username}
                  onChange={updateAuthField}
                  minLength="3"
                  maxLength="50"
                  required
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                value={authForm.email}
                onChange={updateAuthField}
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={authForm.password}
                onChange={updateAuthField}
                minLength="6"
                required
              />
            </label>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Please wait' : submitLabel}
            </button>
          </form>
        </section>
      ) : (
        <section className="dashboard">
          <aside className="account-box">
            <p className="eyebrow">Signed in</p>
            <h2>{session.username}</h2>
            <span className="role-badge">{session.role}</span>
          </aside>

          <section className="workspace">
            <form className="form-card task-form" onSubmit={submitTask}>
              <h2>{taskSubmitLabel}</h2>
              <label>
                Title
                <input
                  name="title"
                  type="text"
                  value={taskForm.title}
                  onChange={updateTaskField}
                  maxLength="120"
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  value={taskForm.description}
                  onChange={updateTaskField}
                  maxLength="1000"
                  rows="4"
                />
              </label>
              <label className="checkbox-row">
                <input
                  name="completed"
                  type="checkbox"
                  checked={taskForm.completed}
                  onChange={updateTaskField}
                />
                Completed
              </label>
              <div className="button-row">
                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? 'Saving' : taskSubmitLabel}
                </button>
                {editingId && (
                  <button className="secondary-button" type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="task-list">
              <div className="list-header">
                <h2>Tasks</h2>
                <button className="secondary-button" type="button" onClick={() => fetchTasks()}>
                  Refresh
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="empty-state">No tasks yet.</div>
              ) : (
                tasks.map((task) => (
                  <article className="task-card" key={task.id}>
                    <div>
                      <h3>{task.title}</h3>
                      {task.description && <p>{task.description}</p>}
                      <span className={task.completed ? 'status done' : 'status'}>
                        {task.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button className="secondary-button" type="button" onClick={() => startEdit(task)}>
                        Edit
                      </button>
                      <button className="danger-button" type="button" onClick={() => deleteTask(task.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      )}
    </main>
  )
}

export default App
