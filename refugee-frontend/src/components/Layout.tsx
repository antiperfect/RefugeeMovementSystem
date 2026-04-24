import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import { InfiniteGridBackground } from './ui/the-infinite-grid';
import CustomCursor from './CustomCursor';

const Layout = () => {
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col relative text-[#0f172a] dark:text-white bg-[#f8f9ff] dark:bg-[#0a0f1a] transition-colors duration-300">
      <CustomCursor />
      <InfiniteGridBackground />
      <TopNavBar />
      <main className="pt-16 lg:pt-20 flex-1 flex flex-col relative z-10 lg:overflow-y-auto lg:h-full">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

