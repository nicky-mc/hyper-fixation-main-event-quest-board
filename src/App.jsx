import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'

import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import CompletedQuests from './pages/CompletedQuests';
import EpisodeCalendar from './pages/EpisodeCalendar';
import AdventurersDirectory from './pages/AdventurersDirectory';
import Friends from './pages/Friends';
import Welcome from './pages/Welcome';
import Discover from './pages/Discover';
import GuildDirectory from './pages/GuildDirectory';
import PodcastArchives from './pages/PodcastArchives';
import ProtectedRoute from '@/components/ProtectedRoute';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Public Welcome page - always accessible */}
      <Route path="/Welcome" element={<Welcome />} />

      {/* Default redirect for unauthenticated users */}
      <Route path="/" element={
        isAuthenticated ? (
          <Navigate to="/QuestBoard" replace />
        ) : (
          <Navigate to="/Welcome" replace />
        )
      } />

      {/* Protected routes - require authentication */}
      <Route path="/QuestBoard" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="QuestBoard">
            <pagesConfig.Pages.QuestBoard />
          </LayoutWrapper>
        </ProtectedRoute>
      } />

      <Route path="/Messages" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="Messages">
            <pagesConfig.Pages.Messages />
          </LayoutWrapper>
        </ProtectedRoute>
      } />

      <Route path="/Friends" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="Friends">
            <Friends />
          </LayoutWrapper>
        </ProtectedRoute>
      } />

      {/* Other auth-required pages from pagesConfig */}
      {Object.entries(pagesConfig.Pages).map(([path, Page]) => {
        // Skip already explicitly defined routes
        if (['QuestBoard', 'Messages'].includes(path)) return null;
        
        return (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <ProtectedRoute>
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />
        );
      })}

      {/* Other explicit protected routes */}
      <Route path="/CompletedQuests" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="CompletedQuests">
            <CompletedQuests />
          </LayoutWrapper>
        </ProtectedRoute>
      } />

      <Route path="/EpisodeCalendar" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="EpisodeCalendar">
            <EpisodeCalendar />
          </LayoutWrapper>
        </ProtectedRoute>
      } />

      <Route path="/AdventurersDirectory" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="AdventurersDirectory">
            <AdventurersDirectory />
          </LayoutWrapper>
        </ProtectedRoute>
      } />

      <Route path="/Discover" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="Discover">
            <Discover />
          </LayoutWrapper>
        </ProtectedRoute>
      } />

      <Route path="/GuildDirectory" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="GuildDirectory">
            <GuildDirectory />
          </LayoutWrapper>
        </ProtectedRoute>
      } />

      <Route path="/PodcastArchives" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="PodcastArchives">
            <PodcastArchives />
          </LayoutWrapper>
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App