import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 px-[4%] pt-14 pb-10 border-t" style={{ borderColor: "var(--surface-2)", background: "var(--bg)" }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[13.5px]">
        <div className="col-span-2">
          <div className="flex items-center gap-1 text-[20px] font-black tracking-tight">
            <span style={{ color: "var(--text)" }}>KDrama</span>
            <span style={{ color: "var(--accent)" }}>World</span>
          </div>
          <p className="mt-3 max-w-md leading-relaxed" style={{ color: "var(--text-dim)" }}>
            Your portal to Korean cinema and television. Discover dramas, track
            trends, and explore the stories shaping K-content today.
          </p>
          <div className="mt-4 flex items-center gap-3 text-[12px]" style={{ color: "var(--text-dim)" }}>
            <a href="https://www.tvmaze.com/api" target="_blank" rel="noreferrer" className="hover:underline">Data: TVMaze</a>
            <span>·</span>
            <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="hover:underline">Images: TMDB</a>
            <span>·</span>
            <span>Fan project, not affiliated</span>
          </div>
        </div>
        <div>
          <h4 className="text-[11px] uppercase tracking-widest font-bold mb-3" style={{ color: "var(--text-muted)" }}>Browse</h4>
          <ul className="space-y-2" style={{ color: "var(--text-dim)" }}>
            <li><Link to="/explore" className="hover:underline">Explore</Link></li>
            <li><Link to="/genres" className="hover:underline">Genres</Link></li>
            <li><Link to="/lists" className="hover:underline">Lists</Link></li>
            <li><Link to="/actors" className="hover:underline">Actors</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] uppercase tracking-widest font-bold mb-3" style={{ color: "var(--text-muted)" }}>About</h4>
          <ul className="space-y-2" style={{ color: "var(--text-dim)" }}>
            <li><Link to="/about" className="hover:underline">About</Link></li>
            <li><Link to="/sources" className="hover:underline">Sources</Link></li>
            <li><Link to="/privacy" className="hover:underline">Privacy</Link></li>
            <li><Link to="/terms" className="hover:underline">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t text-[12px] flex flex-col md:flex-row items-start md:items-center justify-between gap-2"
           style={{ borderColor: "var(--surface-2)", color: "var(--text-muted)" }}>
        <span>© {year} KDramaWorld. All titles and artwork are the property of their respective owners.</span>
        <span>Made with ♥ for K-drama fans.</span>
      </div>
    </footer>
  );
}
