import { useState } from 'react';
import { BrowseView } from '@/components/BrowseView';
import { AdminPanel } from '@/components/AdminPanel';

function App() {
  const [view, setView] = useState<'browse' | 'admin'>('browse');

  return (
    <>
      {view === 'browse' ? (
        <BrowseView onAdminClick={() => setView('admin')} />
      ) : (
        <AdminPanel onExit={() => setView('browse')} />
      )}
    </>
  );
}

export default App;
