"use client";
import {
  Calendar,
  User,
  Tag,
  Smile,
  Instagram,
  Twitter,
  Users,
  TrendingUp,
  Hash,
  Sparkles,
  Link,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ModelInfoTabProps {
  model: ModelDetails;
}

export default function ModelInfoTab({ model }: ModelInfoTabProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/google/cmsheets?clientName=${model.name}`
        );

        if (response.status === 401) {
          setError("You need to authenticate first");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setClient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    if (model.name) {
      setLoading(true);
      fetchData();
    } else {
      setClient([]);
    }
  }, [model.name]);

  const socialLinks = [
    {
      platform: "Instagram",
      icon: Instagram,
      handle: model.instagram,
      url: `https://instagram.com/${model?.instagram?.replace("@", "")}`,
      color: "from-purple-500 to-pink-500",
      textColor: "text-pink-400",
      hoverColor: "hover:text-pink-300",
    },
    {
      platform: "Twitter",
      icon: Twitter,
      handle: model.twitter,
      url: `https://twitter.com/${model?.twitter?.replace("@", "")}`,
      color: "from-blue-400 to-blue-600",
      textColor: "text-blue-400",
      hoverColor: "hover:text-blue-300",
    },
    {
      platform: "TikTok",
      icon: Hash,
      handle: model.tiktok,
      url: `https://tiktok.com/@${model?.tiktok?.replace("@", "")}`,
      color: "from-gray-900 to-gray-700",
      textColor: "text-white",
      hoverColor: "hover:text-gray-300",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl blur-xl group-hover:opacity-100 opacity-50 transition-all duration-300" />
          <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 p-6 hover:border-purple-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              Basic Information
            </h3>
            <div className="space-y-5">
              {/* Status */}
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">Status</label>
                <span
                  className={`inline-flex px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm shadow-lg ${
                    model.status.toLowerCase() === "active"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-green-500/20"
                      : "bg-red-500/20 text-red-400 border border-red-500/30 shadow-red-500/20"
                  }`}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {model.status.toLowerCase() === "active" ? "Active" : "Dropped"}
                </span>
              </div>

              {/* Launch Date */}
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Launch Date
                </label>
                <p className="text-white font-semibold bg-slate-900/30 px-4 py-2 rounded-lg inline-block">
                  {new Date(model.launchDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Referrer */}
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Referrer Name
                </label>
                <p className="text-white font-semibold bg-slate-900/30 px-4 py-2 rounded-lg inline-block">
                  {model.referrerName || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 to-purple-600/10 rounded-2xl blur-xl group-hover:opacity-100 opacity-50 transition-all duration-300" />
          <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 p-6 hover:border-pink-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl">
                <Tag className="w-5 h-5 text-pink-400" />
              </div>
              Personality & Communication
            </h3>
            <div className="space-y-5">
              {/* Personality Type */}
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">
                  Personality Type
                </label>
                <p className="text-white font-semibold bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 py-2 rounded-lg inline-block border border-purple-500/20">
                  {model.personalityType}
                </p>
              </div>

              {/* Common Terms */}
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium">
                  Common Terms
                </label>
                <div className="flex flex-wrap gap-2">
                  {model.commonTerms.map((term, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-default"
                    >
                      {term}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Common Emojis */}
              <div>
                <label className="block text-sm text-gray-400 mb-3 font-medium flex items-center gap-2">
                  <Smile className="w-4 h-4 text-pink-400" />
                  Common Emojis
                </label>
                <div className="flex gap-3 text-2xl">
                  {model.commonEmojis.map((emoji, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, rotate: -180 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="bg-slate-900/30 p-2 rounded-lg hover:bg-slate-900/50 transition-all cursor-default"
                    >
                      {emoji}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Social Media */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-2xl blur-2xl group-hover:opacity-100 opacity-50 transition-all duration-300" />
        <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 p-6 hover:border-slate-600/50 transition-all duration-300">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <Link className="w-5 h-5 text-purple-400" />
            </div>
            Social Media Links
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <motion.div
                  key={social.platform}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="group/social"
                >
                  <label className="block text-sm text-gray-400 mb-3 font-medium flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${social.textColor}`} />
                    {social.platform}
                  </label>
                  {social.handle ? (
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link relative"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${social.color} rounded-lg blur-lg opacity-0 group-hover/link:opacity-30 transition-all duration-300`} />
                      <div className="relative bg-slate-900/50 px-4 py-2.5 rounded-lg border border-slate-700/50 group-hover/link:border-slate-600/50 transition-all duration-300 flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${social.textColor}`} />
                        <span className={`${social.textColor} ${social.hoverColor} transition-colors font-medium`}>
                          {social.handle}
                        </span>
                      </div>
                    </a>
                  ) : (
                    <div className="bg-slate-900/30 px-4 py-2.5 rounded-lg border border-slate-700/30 text-gray-500">
                      Not provided
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Managers and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chatting Managers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-xl group-hover:opacity-100 opacity-50 transition-all duration-300" />
          <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 p-6 hover:border-blue-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              Chatting Managers
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-ping" />
                </div>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-32 bg-slate-700/50 rounded-full animate-pulse" />
                    <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                  </div>
                ) : (
                  <div className="bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50 font-medium text-white">
                    {client[0]?.chattingManagers || "Not assigned"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        {model.stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-2xl blur-xl group-hover:opacity-100 opacity-50 transition-all duration-300" />
            <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 p-6 hover:border-green-500/30 transition-all duration-300">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                Performance Stats
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Total Revenue", value: `${model.stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
                  { label: "Monthly Revenue", value: `${model.stats.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
                  { label: "Subscribers", value: model.stats.subscribers.toLocaleString(), icon: Users, color: "text-blue-400" },
                  { label: "Avg Response Time", value: model.stats.avgResponseTime, icon: Clock, color: "text-purple-400" },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="flex justify-between items-center p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-all"
                    >
                      <span className="text-gray-400 flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${stat.color}`} />
                        {stat.label}
                      </span>
                      <span className="text-white font-bold text-lg">
                        {stat.value}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-pink-600/10 rounded-2xl blur-xl" />
          <div className="relative bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}