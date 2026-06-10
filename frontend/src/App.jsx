import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:8080'
const emptyTask = { title: '', description: '', completed: false }
const emptyAuthForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const usernamePattern = /^[A-Za-z0-9_]{3,20}$/
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuthForm)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('task_session')
    return saved ? JSON.parse(saved) : null
  })
  const [activePage, setActivePage] = useState('tasks')
  const [tasks, setTasks] = useState([])
  const [adminTasks, setAdminTasks] = useState([])
  const [taskForm, setTaskForm] = useState(emptyTask)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [loading, setLoading] = useState(false)

  const isLoggedIn = Boolean(session?.token)
  const isAdmin = session?.role === 'ADMIN'
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
    if (!session) {
      localStorage.removeItem('task_session')
      setTasks([])
      setAdminTasks([])
      setActivePage('tasks')
      return
    }

    localStorage.setItem('task_session', JSON.stringify(session))
    fetchUserTasks(session.token, false)
    if (session.role === 'ADMIN') {
      fetchAdminTasks(session.token, false)
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

  function changeAuthMode(nextMode) {
    setAuthMode(nextMode)
    setAuthForm(emptyAuthForm)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  function validateRegisterForm() {
    if (!usernamePattern.test(authForm.username)) {
      showMessage('Username must be 3-20 characters and use only letters, numbers, or underscore', 'error')
      return false
    }

    if (!passwordPattern.test(authForm.password)) {
      showMessage('Password must be 8+ characters with uppercase, lowercase, and a number', 'error')
      return false
    }

    if (authForm.password !== authForm.confirmPassword) {
      showMessage('Password and confirm password must match', 'error')
      return false
    }

    return true
  }

  async function submitAuth(event) {
    event.preventDefault()

    if (authMode === 'register' && !validateRegisterForm()) {
      return
    }

    setLoading(true)

    const path = authMode === 'login' ? '/api/auth/v1/login' : '/api/auth/v1/register'
    const body =
      authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : {
            username: authForm.username,
            email: authForm.email,
            password: authForm.password,
          }

    try {
      const result = await request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      setSession(result.data)
      setAuthForm(emptyAuthForm)
      showMessage(result.message)
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserTasks(token = session?.token, announce = true) {
    if (!token) return

    try {
      const result = await request('/api/v1/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTasks(result.data || [])
      if (announce) showMessage('User tasks fetched')
    } catch (error) {
      showMessage(error.message, 'error')
    }
  }

  async function fetchAdminTasks(token = session?.token, announce = true) {
    if (!token) return

    try {
      const result = await request('/api/v1/tasks/admin', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAdminTasks(result.data || [])
      if (announce) showMessage('Admin tasks fetched')
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

      setTaskForm(emptyTask)
      setEditingId(null)
      showMessage(result.message)
      fetchUserTasks()
      if (isAdmin) fetchAdminTasks(session.token, false)
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(task) {
    setActivePage('tasks')
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

  async function toggleTaskCompleted(task) {
    setLoading(true)

    try {
      const result = await request(`/api/v1/tasks/${task.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          title: task.title,
          description: task.description || '',
          completed: !task.completed,
        }),
      })

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, completed: !item.completed } : item,
        ),
      )
      if (editingId === task.id) {
        setTaskForm((current) => ({ ...current, completed: !task.completed }))
      }
      if (isAdmin) fetchAdminTasks(session.token, false)
      showMessage(result.message)
    } catch (error) {
      showMessage(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteTask(id) {
    setLoading(true)

    try {
      const result = await request(`/api/v1/tasks/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      setTasks((current) => current.filter((task) => task.id !== id))
      if (isAdmin) fetchAdminTasks(session.token, false)
      if (editingId === id) cancelEdit()
      showMessage(result.message)
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

  function renderUserTasks() {
    if (tasks.length === 0) {
      return <div className="empty-state">No tasks yet.</div>
    }

    return tasks.map((task) => (
      <article className="task-card" key={task.id}>
        <div>
          <div className="task-title-row">
            <input
              aria-label={`Mark ${task.title} complete`}
              checked={task.completed}
              disabled={loading}
              type="checkbox"
              onChange={() => toggleTaskCompleted(task)}
            />
            <h3>{task.title}</h3>
          </div>
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
  }

  function renderAdminTasks() {
    if (adminTasks.length === 0) {
      return <div className="empty-state">No tasks found for admin.</div>
    }

    return adminTasks.map((task) => (
      <article className="task-card admin-task-card" key={task.id}>
        <div>
          <div className="task-title-row">
            <h3>{task.title}</h3>
          </div>
          {task.description && <p>{task.description}</p>}
          <p className="owner-text">Owner: {task.ownerUsername || 'Unknown user'}</p>
          <span className={task.completed ? 'status done' : 'status'}>
            {task.completed ? 'Completed' : 'Pending'}
          </span>
        </div>
      </article>
    ))
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
              onClick={() => changeAuthMode('login')}
            >
              Login
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              type="button"
              onClick={() => changeAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form className="form-card" onSubmit={submitAuth}>
            <h2>{authTitle}</h2>
            {authMode === 'register' && (
              <>
                <label>
                  Username
                  <input
                    name="username"
                    type="text"
                    value={authForm.username}
                    onChange={updateAuthField}
                    minLength="3"
                    maxLength="20"
                    pattern="[A-Za-z0-9_]{3,20}"
                    title="Use 3-20 letters, numbers, or underscore"
                    required
                  />
                </label>
                <p className="help-text">3-20 letters, numbers, or underscore only.</p>
              </>
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
              <div className="password-box">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={authForm.password}
                  onChange={updateAuthField}
                  minLength={authMode === 'register' ? '8' : '6'}
                  pattern={authMode === 'register' ? '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}' : undefined}
                  title="Use 8+ characters with uppercase, lowercase, and a number"
                  required
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="icon-button"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
            </label>

            {authMode === 'register' && (
              <>
                <p className="help-text">8+ characters with uppercase, lowercase, and a number.</p>
                <label>
                  Confirm password
                  <div className="password-box">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={authForm.confirmPassword}
                      onChange={updateAuthField}
                      minLength="8"
                      required
                    />
                    <button
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="icon-button"
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                    >
                      <EyeIcon hidden={showConfirmPassword} />
                    </button>
                  </div>
                </label>
              </>
            )}

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
            <div className="side-nav">
              <button
                className={activePage === 'tasks' ? 'active' : ''}
                type="button"
                onClick={() => setActivePage('tasks')}
              >
                My tasks
              </button>
              {isAdmin && (
                <button
                  className={activePage === 'admin' ? 'active' : ''}
                  type="button"
                  onClick={() => setActivePage('admin')}
                >
                  Admin page
                </button>
              )}
            </div>
          </aside>

          {activePage === 'tasks' && (
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
                  <h2>My Tasks</h2>
                  <button className="secondary-button" type="button" onClick={() => fetchUserTasks()}>
                    Fetch all tasks
                  </button>
                </div>
                {renderUserTasks()}
              </div>
            </section>
          )}

          {activePage === 'admin' && isAdmin && (
            <section className="admin-page">
              <div className="list-header">
                <h2>All Tasks</h2>
                <button className="secondary-button" type="button" onClick={() => fetchAdminTasks()}>
                  Fetch all tasks
                </button>
              </div>
              {renderAdminTasks()}
            </section>
          )}
        </section>
      )}
    </main>
  )
}

function EyeIcon({ hidden }) {
  return (
    <svg aria-hidden="true" className="eye-icon" viewBox="0 0 24 24">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" fill="none" r="3" stroke="currentColor" strokeWidth="2" />
      {hidden && (
        <path
          d="M4 20 20 4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      )}
    </svg>
  )
}

export default App
