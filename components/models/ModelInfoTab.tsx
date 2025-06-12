// components/models/tabs/ModelInfoTab.tsx
"use client";
import { Calendar, User, Tag, Smile, Instagram, Twitter, Users, DollarSign, TrendingUp, Hash } from "lucide-react";

interface ModelInfoTabProps {
  model: ModelDetails;
  isEditing: boolean;
  onModelChange: (model: ModelDetails) => void;
}

export default function ModelInfoTab({ model, isEditing, onModelChange }: ModelInfoTabProps) {
  const handleInputChange = (field: keyof ModelDetails, value: any) => {
    onModelChange({ ...model, [field]: value });
  };

  const handleArrayInputChange = (field: "commonTerms" | "commonEmojis" | "chattingManagers", value: string) => {
    const items = value.split(",").map(item => item.trim()).filter(item => item);
    handleInputChange(field, items);
  };

  return (
    <div className="space-y-8">
      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            Basic Information
          </h3>
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              {isEditing ? (
                <select
                  value={model.status}
                  onChange={(e) => handleInputChange("status", e.target.value as "active" | "dropped")}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active</option>
                  <option value="dropped">Dropped</option>
                </select>
              ) : (
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  model.status.toLowerCase() === "active" 
                    ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  {model.status.toLowerCase() === "active" ? "Active" : "Dropped"}
                </span>
              )}
            </div>

            {/* Launch Date */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Launch Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={model.launchDate}
                  onChange={(e) => handleInputChange("launchDate", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="text-white">{new Date(model.launchDate).toLocaleDateString()}</p>
              )}
            </div>

            {/* Referrer */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Referrer Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={model.referrerName}
                  onChange={(e) => handleInputChange("referrerName", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="text-white">{model.referrerName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Personality */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-400" />
            Personality & Communication
          </h3>
          <div className="space-y-4">
            {/* Personality Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Personality Type</label>
              {isEditing ? (
                <input
                  type="text"
                  value={model.personalityType}
                  onChange={(e) => handleInputChange("personalityType", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="text-white">{model.personalityType}</p>
              )}
            </div>

            {/* Common Terms */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Common Terms</label>
              {isEditing ? (
                <input
                  type="text"
                  value={model.commonTerms.join(", ")}
                  onChange={(e) => handleArrayInputChange("commonTerms", e.target.value)}
                  placeholder="Enter terms separated by commas"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {model.commonTerms.map((term, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      {term}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Common Emojis */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Smile className="inline w-4 h-4 mr-1" />
                Common Emojis
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={model.commonEmojis.join(" ")}
                  onChange={(e) => handleArrayInputChange("commonEmojis", e.target.value.split(" ").join(","))}
                  placeholder="Enter emojis separated by spaces"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <div className="flex gap-2 text-2xl">
                  {model.commonEmojis.map((emoji, index) => (
                    <span key={index}>{emoji}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Social Media Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Instagram */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Instagram className="inline w-4 h-4 mr-1 text-pink-400" />
              Instagram
            </label>
            {isEditing ? (
              <input
                type="text"
                value={model.instagram}
                onChange={(e) => handleInputChange("instagram", e.target.value)}
                placeholder="@username"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            ) : (
              <a
                href={`https://instagram.com/${model?.instagram?.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 hover:text-pink-300 transition-colors"
              >
                {model.instagram}
              </a>
            )}
          </div>

          {/* Twitter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Twitter className="inline w-4 h-4 mr-1 text-blue-400" />
              Twitter
            </label>
            {isEditing ? (
              <input
                type="text"
                value={model.twitter}
                onChange={(e) => handleInputChange("twitter", e.target.value)}
                placeholder="@username"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            ) : (
              <a
                href={`https://twitter.com/${model?.twitter?.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {model.twitter}
              </a>
            )}
          </div>

          {/* TikTok */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Hash className="inline w-4 h-4 mr-1" />
              TikTok
            </label>
            {isEditing ? (
              <input
                type="text"
                value={model.tiktok}
                onChange={(e) => handleInputChange("tiktok", e.target.value)}
                placeholder="@username"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            ) : (
              <a
                href={`https://tiktok.com/@${model?.tiktok?.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-300 transition-colors"
              >
                {model.tiktok}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Managers and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chatting Managers */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Chatting Managers
          </h3>
          {isEditing ? (
            <input
              type="text"
              value={model.chattingManagers.join(", ")}
              onChange={(e) => handleArrayInputChange("chattingManagers", e.target.value)}
              placeholder="Enter managers separated by commas"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <div className="space-y-2">
              {model.chattingManagers.map((manager, index) => (
                <div key={index} className="flex items-center gap-2 text-white">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  {manager}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        {model.stats && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Performance Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Revenue</span>
                <span className="text-white font-semibold">
                  ${model.stats.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Monthly Revenue</span>
                <span className="text-white font-semibold">
                  ${model.stats.monthlyRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Subscribers</span>
                <span className="text-white font-semibold">
                  {model.stats.subscribers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Avg Response Time</span>
                <span className="text-white font-semibold">
                  {model.stats.avgResponseTime}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}