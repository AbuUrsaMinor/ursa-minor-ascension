import { Route, Routes } from 'react-router-dom';
import { AppLanding } from './components/AppLanding';
import { CaptureView } from './components/CaptureView';
import { CreatorDashboard } from './components/CreatorDashboard';
import { CreatorLayout } from './components/CreatorLayout';
import { SeriesDetailCreator } from './components/SeriesDetailCreator';
import { SeriesDetailViewer } from './components/SeriesDetailViewer';
import { SeriesReview } from './components/SeriesReview';
import { StudyPackLibrary } from './components/StudyPackLibrary';
import { StudyPackView } from './components/StudyPackView';
import { ViewerDashboard } from './components/ViewerDashboard';
import { ViewerLayout } from './components/ViewerLayout';

export function AppRoutes() {
    return (
        <Routes>
            {/* Landing page for domain selection */}
            <Route path="/" element={<AppLanding />} />

            {/* Creator domain routes */}
            <Route path="/creator" element={<CreatorLayout />}>
                <Route index element={<CreatorDashboard />} />
                <Route path="dashboard" element={<CreatorDashboard />} />
                <Route path="series/:seriesId" element={<SeriesDetailCreator />} />
                <Route path="capture" element={<CaptureView />} />
                <Route path="review" element={<SeriesReview />} />
            </Route>

            {/* Legacy creator routes with redirects */}
            <Route path="/capture" element={<CaptureView />} />
            <Route path="/review" element={<SeriesReview />} />
            <Route path="/series/:seriesId" element={<SeriesDetailCreator />} />

            {/* Viewer domain routes */}
            <Route path="/viewer" element={<ViewerLayout />}>
                <Route index element={<ViewerDashboard />} />
                <Route path="dashboard" element={<ViewerDashboard />} />
                <Route path="series/:seriesId" element={<SeriesDetailViewer />} />                <Route path="studypacks" element={<StudyPackLibrary />} />
                <Route path="studypack/:packId" element={<StudyPackView />} />
            </Route>

            {/* Legacy viewer routes with redirects */}
            <Route path="/studypacks" element={<StudyPackLibrary />} />
            <Route path="/studypack/:packId" element={<StudyPackView />} />
        </Routes>
    );
}
