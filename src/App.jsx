import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import WorkOrders from './pages/WorkOrders';
import HistoryLog from './pages/HistoryLog';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="work-orders" element={<WorkOrders />} />
        <Route path="history" element={<HistoryLog />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
}
