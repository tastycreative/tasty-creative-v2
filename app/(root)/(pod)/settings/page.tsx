"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Settings as SettingsIcon, User } from 'lucide-react';
import ContentTypePricingTab from '@/components/ContentTypePricingTab';

const Settings = () => {
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your application settings and preferences</p>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Content Pricing
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Content Pricing Tab */}
        <TabsContent value="pricing">
          <ContentTypePricingTab />
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Application-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">General settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">Account settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
