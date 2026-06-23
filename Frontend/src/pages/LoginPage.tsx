const LoginPage = () => {

const handleLogin = async () => {
  try {
    const API_URL = import.meta.env.VITE_API_URL
    const response = await fetch(`${API_URL}/auth/login`)
    const data = await response.json()
    window.location.href = data.url
  } catch (error) {
    console.error('Login failed:', error)
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">

        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">SF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Validation Rule Manager
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Connect to your Salesforce org to manage validation rules
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
        >
          Login with Salesforce
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Secured via OAuth 2.0 — your credentials are never stored
        </p>

      </div>
    </div>
  )
}

export default LoginPage