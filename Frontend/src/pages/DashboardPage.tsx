import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import type { ValidationRule, DeployPayload } from '../types/salesforce'

const DashboardPage = () => {
 const API_URL = import.meta.env.VITE_API_URL
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [rules, setRules] = useState<ValidationRule[]>([])
  const [loading, setLoading] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [message, setMessage] = useState('')

  const token = searchParams.get('token') || ''
  const instance = searchParams.get('instance') || ''

  useEffect(() => {
    if (!token || !instance) {
      navigate('/')
    }
  }, [token, instance, navigate])

  const fetchRules = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`${API_URL}/api/validation-rules`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-instance-url': decodeURIComponent(instance)
        }
      })
      const data = await response.json()
      setRules(data)
    } catch {
      setMessage('Failed to fetch validation rules.')
    } finally {
      setLoading(false)
    }
  }

  const toggleRule = (id: string) => {
    setRules(prev =>
      prev.map(rule =>
        rule.Id === id ? { ...rule, Active: !rule.Active } : rule
      )
    )
  }

  const enableAll = () => {
    setRules(prev => prev.map(rule => ({ ...rule, Active: true })))
  }

  const disableAll = () => {
    setRules(prev => prev.map(rule => ({ ...rule, Active: false })))
  }

  const deployChanges = async () => {
    setDeploying(true)
    setMessage('')
    try {
      const payload: DeployPayload[] = rules.map(r => ({
        Id: r.Id,
        Active: r.Active
      }))

     const response = await fetch(`${API_URL}/api/validation-rules/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-instance-url': decodeURIComponent(instance)
        },
        body: JSON.stringify({ rules: payload })
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Changes deployed to Salesforce successfully!')
      } else {
        setMessage('Deploy failed. Please try again.')
      }
    } catch {
      setMessage('Deploy failed. Please try again.')
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-lg font-bold">Validation Rule Manager</h1>
        <button
          onClick={() => navigate('/')}
          className="text-sm bg-white text-blue-600 px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Fetch Button */}
        {rules.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-6">
              Click below to load validation rules from your Salesforce org
            </p>
            <button
              onClick={fetchRules}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Get Validation Rules'}
            </button>
          </div>
        )}

        {/* Rules List */}
        {rules.length > 0 && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={enableAll}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-medium transition-colors"
              >
                Enable All
              </button>
              <button
                onClick={disableAll}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-medium transition-colors"
              >
                Disable All
              </button>
              <button
                onClick={deployChanges}
                disabled={deploying}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ml-auto"
              >
                {deploying ? 'Deploying...' : 'Deploy Changes'}
              </button>
            </div>

            {/* Status Message */}
            {message && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                {message}
              </div>
            )}

            {/* Rules Cards */}
            <div className="space-y-3">
              {rules.map(rule => (
                <div
                  key={rule.Id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {rule.ValidationName}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {rule.Description || 'No description'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      rule.Active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {rule.Active ? 'Active' : 'Inactive'}
                    </span>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleRule(rule.Id)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        rule.Active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        rule.Active ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardPage