import { Route, Routes } from 'react-router-dom';
import { CaptureView } from './components/CaptureView';
import { Dashboard } from './components/Dashboard';
import { SeriesDetail } from './components/SeriesDetail';
import { SeriesReview } from './components/SeriesReview';

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/capture" element={<CaptureView />} />
            <Route path="/review" element={<SeriesReview />} />
            <Route path="/series/:seriesId" element={<SeriesDetail />} />
        </Routes>
    );
}
