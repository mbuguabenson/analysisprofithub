"use client"

import { useState } from "react"
import { Save, RotateCcw, AlertCircle } from "lucide-react"

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState({
    minStake: 1,
    maxStake: 1000,
    minBalance: 10,
    maxBalance: 100000,
    autoTradeEnabled: true,
    strategyEnabled: true,
    dailyLossLimit: 500,
    hourlyLossLimit: 100,
    emailNotifications: true,
    slackNotifications: false,
    slackWebhook: "",
    maintenanceMode: false,
  })

  const [savedMessage, setSavedMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(Number(value)) ? value : Number(value)
      }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setSavedMessage("Settings saved successfully!")
      setTimeout(() => setSavedMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      setSavedMessage("Error saving settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setFormData({
      minStake: 1,
      maxStake: 1000,
      minBalance: 10,
      maxBalance: 100000,
      autoTradeEnabled: true,
      strategyEnabled: true,
      dailyLossLimit: 500,
      hourlyLossLimit: 100,
      emailNotifications: true,
      slackNotifications: false,
      slackWebhook: "",
      maintenanceMode: false,
    })
    setSavedMessage("Settings reset to defaults")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">System Configuration</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage platform-wide settings and parameters
        </p>
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Trading Parameters */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-6">Trading Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Minimum Stake ($)
              </label>
              <input
                type="number"
                name="minStake"
                value={formData.minStake}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Lowest allowed stake amount</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Maximum Stake ($)
              </label>
              <input
                type="number"
                name="maxStake"
                value={formData.maxStake}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Highest allowed stake amount</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Minimum Balance ($)
              </label>
              <input
                type="number"
                name="minBalance"
                value={formData.minBalance}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum account balance</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Maximum Balance ($)
              </label>
              <input
                type="number"
                name="maxBalance"
                value={formData.maxBalance}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum account balance cap</p>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-6">Risk Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Daily Loss Limit ($)
              </label>
              <input
                type="number"
                name="dailyLossLimit"
                value={formData.dailyLossLimit}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Max daily loss across all trades</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Hourly Loss Limit ($)
              </label>
              <input
                type="number"
                name="hourlyLossLimit"
                value={formData.hourlyLossLimit}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-xs text-gray-500 mt-1">Max hourly loss across all trades</p>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-6">Feature Toggles</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="autoTradeEnabled"
                checked={formData.autoTradeEnabled}
                onChange={handleChange}
                className="w-5 h-5 rounded bg-white/10 border border-white/20 text-blue-500 cursor-pointer"
              />
              <span className="text-white font-bold">Enable Auto-Trading</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="strategyEnabled"
                checked={formData.strategyEnabled}
                onChange={handleChange}
                className="w-5 h-5 rounded bg-white/10 border border-white/20 text-blue-500 cursor-pointer"
              />
              <span className="text-white font-bold">Enable Trading Strategies</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="maintenanceMode"
                checked={formData.maintenanceMode}
                onChange={handleChange}
                className="w-5 h-5 rounded bg-white/10 border border-white/20 text-blue-500 cursor-pointer"
              />
              <span className="text-white font-bold">Maintenance Mode</span>
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-6">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={formData.emailNotifications}
                onChange={handleChange}
                className="w-5 h-5 rounded bg-white/10 border border-white/20 text-blue-500 cursor-pointer"
              />
              <span className="text-white font-bold">Email Notifications</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="slackNotifications"
                checked={formData.slackNotifications}
                onChange={handleChange}
                className="w-5 h-5 rounded bg-white/10 border border-white/20 text-blue-500 cursor-pointer"
              />
              <span className="text-white font-bold">Slack Notifications</span>
            </label>

            {formData.slackNotifications && (
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Slack Webhook URL
                </label>
                <input
                  type="text"
                  name="slackWebhook"
                  value={formData.slackWebhook}
                  onChange={handleChange}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-400 mb-1">
              Important: Changes to system settings affect all users
            </p>
            <p className="text-xs text-amber-300">
              Please review all changes carefully before saving. All modifications are logged for audit purposes.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Settings"}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
        </div>

        {/* Save Message */}
        {savedMessage && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold">
            {savedMessage}
          </div>
        )}
      </div>
    </div>
  )
}
