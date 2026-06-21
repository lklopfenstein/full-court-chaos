import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const PALETTES = [
  ['#ff2ca8', '#00e5ff', '#ffca3a', '#171a45', '#f3efff'],
  ['#ff6b22', '#8bf000', '#ffe8c2', '#161735', '#7c2cff'],
  ['#00e5ff', '#5b37ff', '#faff00', '#11152f', '#ff4f84'],
  ['#ff3d21', '#ffd644', '#20dbc8', '#130c2c', '#f7f1dc'],
];

const seedPlayers = [
  {
    id: 'nova', realName: 'Maya R.', alias: 'NOVA', number: '08', city: 'Brooklyn, NY', position: 'PG',
    tagline: 'Gravity is optional.', power: 'COSMIC CROSSOVER', palette: 0,
    avatar: '/players/nova.png',
    stats: { pts: 22.4, ast: 8.2, reb: 4.1, stl: 3.4, blk: 0.4 }, wins: 7, heat: 96,
  },
  {
    id: 'glitch', realName: 'Jalen T.', alias: 'GLITCH', number: '404', city: 'Newark, NJ', position: 'SG',
    tagline: 'Now you see me. Now buckets.', power: 'LAG STEP', palette: 1,
    avatar: '/players/glitch.png',
    stats: { pts: 25.8, ast: 4.7, reb: 5.2, stl: 1.8, blk: 0.7 }, wins: 6, heat: 93,
  },
  {
    id: 'bigfoot', realName: 'Cooper B.', alias: 'BIGFOOT', number: '77', city: 'Asheville, NC', position: 'C',
    tagline: 'No rim is safe.', power: 'EARTHQUAKE DUNK', palette: 2,
    avatar: '/players/bigfoot.png',
    stats: { pts: 18.6, ast: 2.1, reb: 13.7, stl: 1.2, blk: 4.8 }, wins: 8, heat: 98,
  },
  {
    id: 'hot-sauce', realName: 'Ari S.', alias: 'HOT SAUCE', number: '99', city: 'Baltimore, MD', position: 'SF',
    tagline: 'Too spicy to guard.', power: 'INFERNO FADE', palette: 3,
    avatar: '/players/hot-sauce.png',
    stats: { pts: 21.2, ast: 5.5, reb: 7.9, stl: 2.6, blk: 1.1 }, wins: 5, heat: 91,
  },
];

const schedule = [
  { date: 'JUL 12', city: 'BALTIMORE, MD', venue: 'THE REC YARD', status: 'TICKETS LIVE', color: 'pink' },
  { date: 'JUL 26', city: 'PHILADELPHIA, PA', venue: 'RIVER RINK', status: 'ALMOST GONE', color: 'cyan' },
  { date: 'AUG 09', city: 'BROOKLYN, NY', venue: 'PIER 2', status: 'COMING SOON', color: 'yellow' },
];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function drawGeneratedAvatar(canvas, alias, paletteIndex = 0) {
  const ctx = canvas.getContext('2d');
  const [a, b, c, dark, light] = PALETTES[paletteIndex % PALETTES.length];
  const hash = [...alias].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  canvas.width = 192; canvas.height = 192;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = dark; ctx.fillRect(0, 0, 192, 192);
  for (let y = 0; y < 192; y += 12) {
    for (let x = 0; x < 192; x += 12) {
      if (((x + y + hash) / 12) % 7 === 0) { ctx.fillStyle = `${b}35`; ctx.fillRect(x, y, 12, 12); }
    }
  }
  ctx.fillStyle = a; ctx.fillRect(18, 148, 156, 44);
  ctx.fillStyle = b; ctx.fillRect(30, 136, 132, 16);
  const skin = ['#7f4127', '#a45e38', '#d78b58', '#f3ba7a'][hash % 4];
  const hair = ['#160c18', '#2a1523', '#392117'][hash % 3];
  ctx.fillStyle = skin;
  ctx.fillRect(54, 48, 84, 82); ctx.fillRect(66, 32, 60, 20);
  ctx.fillStyle = hair;
  ctx.fillRect(54, 34, 84, 30);
  if (hash % 2) { ctx.fillRect(42, 45, 18, 44); ctx.fillRect(132, 45, 18, 44); }
  else { for (let x = 54; x < 138; x += 14) ctx.fillRect(x, 22 + ((x / 14) % 2) * 6, 14, 26); }
  ctx.fillStyle = light;
  ctx.fillRect(69, 78, 16, 12); ctx.fillRect(108, 78, 16, 12);
  ctx.fillStyle = dark;
  ctx.fillRect(75, 82, 8, 8); ctx.fillRect(108, 82, 8, 8);
  ctx.fillRect(82, 111, 30, 8);
  ctx.fillStyle = c; ctx.fillRect(88, 136, 16, 56);
  ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.strokeRect(8, 8, 176, 176);
}

function PixelAvatar({ player, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || player.avatar) return;
    drawGeneratedAvatar(ref.current, player.alias, player.palette || 0);
  }, [player]);
  if (player.avatar) return <img className={`pixel-avatar ${className}`} src={player.avatar} alt={`${player.alias} pixel portrait`} />;
  return <canvas className={`pixel-avatar ${className}`} ref={ref} role="img" aria-label={`${player.alias} pixel portrait`} />;
}

function preparePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/^image\/(png|jpe?g|webp)$/)) { reject(new Error('Please choose a JPG, PNG, or WEBP photo.')); return; }
    if (file.size > 10 * 1024 * 1024) { reject(new Error('Please choose a photo smaller than 10 MB.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('That photo could not be read.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That photo could not be opened.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSide = 896;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .86));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function forgeArcadeAvatar(photo, player) {
  const response = await fetch('/api/pixelize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo, alias: player.alias, position: player.position }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.avatar) throw new Error(data.error || 'The avatar forge missed that shot. Please try again.');
  return { avatar: data.avatar, photo };
}

function Logo({ small = false }) {
  return <div className={`logo ${small ? 'small' : ''}`}><span>FULL COURT</span><strong>CHAOS</strong><i>★ YOUTH HOOPS ★</i></div>;
}

function Marquee() {
  const words = 'NO BORING BUCKETS • ALTER EGO ACTIVATED • SHOWTIME IS GAME TIME • CROWD GOES WILD • ';
  return <div className="marquee" aria-hidden="true"><div>{words.repeat(5)}</div></div>;
}

function PlayerCard({ player, onClick, rank }) {
  return (
    <button className="player-card" onClick={() => onClick(player)} aria-label={`Open ${player.alias} profile`}>
      <div className="card-top"><span>PLAYER {String(rank).padStart(2, '0')}</span><b>{player.position}</b></div>
      <div className="portrait-wrap"><PixelAvatar player={player} /><span className="number">#{player.number}</span><span className="heat">{player.heat} HEAT</span></div>
      <div className="card-copy"><h3>{player.alias}</h3><p>{player.tagline}</p></div>
      <div className="quick-stats"><span><b>{player.stats.pts}</b> PPG</span><span><b>{player.stats.ast}</b> APG</span><span><b>{player.stats.reb}</b> RPG</span></div>
      <div className="select-link">VIEW PLAYER <span>›</span></div>
    </button>
  );
}

function PlayerModal({ player, onClose }) {
  if (!player) return null;
  const stats = [
    ['SCORING', Math.min(100, player.stats.pts * 3.7)], ['PLAYMAKING', Math.min(100, player.stats.ast * 10)],
    ['BOARDS', Math.min(100, player.stats.reb * 7)], ['CHAOS', player.heat],
  ];
  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-label={`${player.alias} profile`}>
      <div className="profile-modal">
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <div className="profile-kicker">PLAYER SELECT / {player.position}</div>
        <div className="profile-grid">
          <div className="profile-portrait"><div className="sunburst" /><PixelAvatar player={player} /><span className="huge-number">{player.number}</span></div>
          <div className="profile-info">
            <div className="real-name">ALTER EGO OF {player.realName.toUpperCase()}</div>
            <h2>{player.alias}</h2>
            <p className="quote">“{player.tagline}”</p>
            <div className="bio-line"><span>HOMETOWN</span><b>{player.city}</b><span>RECORD</span><b>{player.wins}-1</b></div>
            <div className="power-up"><span>SIGNATURE POWER</span><strong>{player.power}</strong></div>
            <div className="meters">{stats.map(([label, value]) => <div className="meter" key={label}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><em>{Math.round(value)}</em></div>)}</div>
            <div className="profile-stats">{Object.entries(player.stats).map(([key, value]) => <div key={key}><b>{value}</b><span>{key.toUpperCase()}</span></div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Registration({ onClose, onCreate }) {
  const [form, setForm] = useState({ realName: '', alias: '', number: '', city: '', position: 'PG', guardian: '' });
  const [avatar, setAvatar] = useState('');
  const [sourcePhoto, setSourcePhoto] = useState('');
  const [forgeStatus, setForgeStatus] = useState('');
  const [forgeError, setForgeError] = useState('');
  const [step, setStep] = useState(1);
  const generated = { ...form, alias: form.alias || 'PLAYER 1', number: form.number || '00', palette: 0, avatar };
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhoto = async (file) => {
    setAvatar('');
    setForgeError('');
    setForgeStatus('SCOUTING YOUR LOOK…');
    try {
      const prepared = await preparePhoto(file);
      setSourcePhoto(prepared);
      setForgeStatus('BUILDING YOUR GAME SPRITE…');
      const result = await forgeArcadeAvatar(prepared, form);
      setAvatar(result.avatar);
      setForgeStatus('PLAYER RENDER COMPLETE');
    } catch (error) {
      setForgeStatus('');
      setForgeError(error.message);
    }
  };
  const submit = (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    if (!avatar) return;
    onCreate({
      id: `local-${Date.now()}`, ...form, alias: form.alias.toUpperCase(),
      stats: { pts: 0, ast: 0, reb: 0, stl: 0, blk: 0 }, wins: 0, heat: 70,
      tagline: 'Rookie mode: OFF.', power: 'TO BE UNLOCKED', avatar,
    });
  };
  return (
    <div className="modal-shell registration-shell" role="dialog" aria-modal="true" aria-label="Create a player">
      <form className="registration" onSubmit={submit}>
        <button type="button" className="close" onClick={onClose}>×</button>
        <div className="form-head"><span>CREATE-A-PLAYER</span><b>STEP {step} / 2</b></div>
        <div className="form-progress"><i className={step >= 1 ? 'on' : ''} /><i className={step >= 2 ? 'on' : ''} /></div>
        {step === 1 ? <>
          <h2>WHO ARE YOU<br/><em>ON THE COURT?</em></h2>
          <p className="form-intro">Players become characters. Pick a name loud enough for an announcer to yell.</p>
          <div className="input-grid">
            <label>REAL FIRST NAME<input required name="realName" value={form.realName ?? ''} onChange={update} placeholder="Maya" /></label>
            <label>ALTER-EGO NAME<input required name="alias" value={form.alias ?? ''} onChange={update} placeholder="NOVA" maxLength="14" /></label>
            <label>JERSEY NUMBER<input required name="number" value={form.number ?? ''} onChange={update} placeholder="08" maxLength="3" /></label>
            <label>POSITION<select name="position" value={form.position ?? 'PG'} onChange={update}><option>PG</option><option>SG</option><option>SF</option><option>PF</option><option>C</option></select></label>
            <label className="wide">HOMETOWN<input required name="city" value={form.city ?? ''} onChange={update} placeholder="Brooklyn, NY" /></label>
            <label className="wide">GUARDIAN EMAIL<input required type="email" name="guardian" value={form.guardian ?? ''} onChange={update} placeholder="grownup@example.com" /></label>
            <label className="wide consent"><input required type="checkbox" /> <span>I am the player’s parent or guardian and approve creation of this profile.</span></label>
          </div>
        </> : <>
          <h2>PIXEL MODE:<br/><em>ACTIVATED</em></h2>
          <p className="form-intro">Upload a clear photo with the player’s face visible. The avatar forge preserves their identity, then rebuilds them as a digitized arcade-game sprite.</p>
          <div className="photo-step">
            <label className={`upload-zone ${forgeStatus && !avatar ? 'forging' : ''}`}>
              {avatar ? <PixelAvatar player={generated} /> : sourcePhoto ? <img className="source-photo" src={sourcePhoto} alt="Uploaded player awaiting arcade conversion" /> : <><span className="upload-icon">＋</span><b>DROP YOUR PLAYER PHOTO</b><small>JPG, PNG, or WEBP · 10 MB max</small></>}
              {forgeStatus && <span className="forge-status"><i />{forgeStatus}</span>}
              <input disabled={Boolean(forgeStatus && !avatar)} required={!avatar} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
            </label>
            <div className="mini-card"><span>PLAYER PREVIEW</span><h3>{generated.alias.toUpperCase()}</h3><b>#{generated.number}</b><p>{generated.position} · {generated.city || 'HOMETOWN'}</p></div>
          </div>
          {forgeError && <div className="forge-error">⚠ {forgeError}</div>}
          <p className="privacy-note">GUARDIAN NOTE: The photo is sent securely for one-time avatar generation. Full Court Chaos does not save the original upload in this prototype.</p>
        </>}
        <div className="form-actions">{step === 2 && <button type="button" className="back-btn" onClick={() => setStep(1)}>‹ BACK</button>}<button className="primary-btn" disabled={step === 2 && (!avatar || Boolean(forgeStatus && !avatar))} type="submit">{step === 1 ? 'NEXT: PIXELIZE ME' : 'LOCK IN PLAYER'} <span>››</span></button></div>
      </form>
    </div>
  );
}

function Scorekeeper({ players, setPlayers }) {
  const [selected, setSelected] = useState(players[0]?.id || '');
  const player = players.find(p => p.id === selected) || players[0];
  if (!player) return null;
  const add = (stat, amount) => setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, stats: { ...p.stats, [stat]: Math.max(0, +(p.stats[stat] + amount).toFixed(1)) } } : p));
  return (
    <section id="scorekeeper" className="scorekeeper section-pad">
      <div className="section-heading light"><div><span>THE CONTROL ROOM</span><h2>LIVE STAT LAB</h2></div><p>A prototype scorekeeper console. Every tap updates the selected player card and saves to this device.</p></div>
      <div className="console">
        <div className="console-player"><PixelAvatar player={player} /><div><small>NOW TRACKING</small><select value={selected ?? ''} onChange={e => setSelected(e.target.value)}>{players.map(p => <option value={p.id} key={p.id}>{p.alias}</option>)}</select><strong>#{player.number} · {player.position}</strong></div></div>
        <div className="stat-controls">{Object.entries(player.stats).map(([stat, value]) => <div className="stat-control" key={stat}><span>{stat}</span><b>{value}</b><div><button onClick={() => add(stat, -1)}>−</button><button onClick={() => add(stat, 1)}>＋</button></div></div>)}</div>
        <div className="save-light"><i /> SAVES AUTOMATICALLY</div>
      </div>
    </section>
  );
}

function App() {
  const [players, setPlayersState] = useState(() => {
    try {
      const saved = localStorage.getItem('fcc-players');
      if (!saved) return seedPlayers;
      const stored = JSON.parse(saved);
      const custom = stored.filter(player => !seedPlayers.some(seed => seed.id === player.id));
      const demos = seedPlayers.map(seed => ({ ...stored.find(player => player.id === seed.id), ...seed }));
      return [...demos, ...custom];
    } catch { return seedPlayers; }
  });
  const [profile, setProfile] = useState(null);
  const [register, setRegister] = useState(false);
  const [menu, setMenu] = useState(false);
  const setPlayers = (next) => setPlayersState(prev => typeof next === 'function' ? next(prev) : next);
  useEffect(() => {
    try { localStorage.setItem('fcc-players', JSON.stringify(players)); }
    catch { console.warn('Player data could not be saved in this browser.'); }
  }, [players]);
  const leaders = useMemo(() => [...players].sort((a, b) => b.stats.pts - a.stats.pts), [players]);
  const created = (player) => { setPlayersState(prev => [...prev, player]); setRegister(false); setProfile(player); };
  const scrollTo = (id) => { setMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
  return <>
    <header>
      <button className="brand-button" onClick={() => scrollTo('top')}><Logo small /></button>
      <nav className={menu ? 'open' : ''}>
        <button onClick={() => scrollTo('players')}>PLAYERS</button><button onClick={() => scrollTo('tour')}>THE TOUR</button><button onClick={() => scrollTo('rules')}>HOW IT WORKS</button><button onClick={() => scrollTo('scorekeeper')}>STAT LAB</button>
      </nav>
      <button className="join-top" onClick={() => setRegister(true)}>CREATE A PLAYER <span>↗</span></button>
      <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? '×' : '☰'}</button>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-copy">
          <div className="eyebrow"><i /> BASKETBALL, BUT UNHINGED</div>
          <h1>YOUR GAME.<br/><span>YOUR ALTER EGO.</span><br/>YOUR SHOW.</h1>
          <p>A youth basketball league where players become characters, every bucket tells a story, and the crowd is part of the game.</p>
          <div className="hero-actions"><button className="primary-btn" onClick={() => setRegister(true)}>ENTER THE CHAOS <span>››</span></button><button className="ghost-btn" onClick={() => scrollTo('players')}><i>▶</i> MEET THE PLAYERS</button></div>
        </div>
        <div className="hero-stamp"><span>EST.</span><strong>20<br/>26</strong><em>PLAY LOUD</em></div>
        <div className="scroll-note">SCROLL TO START <i>↓</i></div>
      </section>
      <Marquee />

      <section id="players" className="players-section section-pad">
        <div className="section-heading"><div><span>CHOOSE YOUR CHAOS</span><h2>MEET THE ROSTER</h2></div><p>Real kids. Larger-than-life alter egos. Real stats tracked every time they step on the floor.</p></div>
        <div className="player-grid">{players.map((p, i) => <PlayerCard key={p.id} player={p} rank={i + 1} onClick={setProfile} />)}</div>
        <button className="text-button" onClick={() => setRegister(true)}>THINK YOU BELONG HERE? <b>CREATE YOUR PLAYER →</b></button>
      </section>

      <section className="manifesto">
        <div className="manifesto-noise" />
        <div className="manifesto-copy"><span>THIS AIN'T YOUR NORMAL LEAGUE</span><h2>WE KEEP SCORE.<br/><em>WE ALSO KEEP IT WEIRD.</em></h2><p>Full Court Chaos combines real competition with entrances, nicknames, power plays, fan challenges, trick-shot timeouts, and maximum personality.</p></div>
        <div className="manifesto-cards"><article><b>01</b><h3>REAL HOOPS</h3><p>Official refs, tracked stats, competitive games.</p></article><article><b>02</b><h3>BIG CHARACTERS</h3><p>Every player creates an unforgettable alter ego.</p></article><article><b>03</b><h3>FULL SHOW</h3><p>Music, intros, wild rules, and crowd-powered moments.</p></article></div>
      </section>

      <section id="rules" className="rules section-pad">
        <div className="section-heading"><div><span>HOW THE MADNESS WORKS</span><h2>THREE STEPS TO LEGEND</h2></div></div>
        <div className="steps">
          <article><span className="step-no">01</span><div className="step-icon">♟</div><h3>BUILD YOUR ALTER EGO</h3><p>Choose a name, number, look, signature move, and upload a photo.</p><i>CREATE-A-PLAYER</i></article>
          <article><span className="step-no">02</span><div className="step-icon">▦</div><h3>GET PIXELIZED</h3><p>Your real photo becomes a custom arcade-style player portrait.</p><i>PIXEL MODE</i></article>
          <article><span className="step-no">03</span><div className="step-icon">ϟ</div><h3>MAKE THE CROWD ROAR</h3><p>Play real games, earn real stats, climb the Chaos leaderboard.</p><i>SHOWTIME</i></article>
        </div>
      </section>

      <section id="tour" className="tour section-pad">
        <div className="section-heading light"><div><span>CHAOS IS COMING</span><h2>THE 2026 TOUR</h2></div><p>Three cities. One traveling spectacle. Zero quiet gyms.</p></div>
        <div className="tour-list">{schedule.map((s, i) => <article key={s.city}><span className={`city-index ${s.color}`}>0{i + 1}</span><time>{s.date}</time><div><h3>{s.city}</h3><p>{s.venue} · DOORS 5:30 PM</p></div><button onClick={() => alert(`${s.city} ticket notifications are coming soon.`)}>{s.status} <b>↗</b></button></article>)}</div>
      </section>

      <section className="leaderboard section-pad">
        <div className="section-heading"><div><span>ARCADE LEADERBOARD</span><h2>WHO'S ON FIRE?</h2></div><p>Season leaders update as scorekeepers log each game.</p></div>
        <div className="leader-table"><div className="leader-row header-row"><span>RK</span><span>PLAYER</span><span>PTS</span><span>AST</span><span>REB</span><span>HEAT</span></div>{leaders.slice(0, 5).map((p, i) => <button className="leader-row" key={p.id} onClick={() => setProfile(p)}><b>0{i + 1}</b><span className="leader-name"><PixelAvatar player={p} /><strong>{p.alias}<small>{p.position} · #{p.number}</small></strong></span><span>{p.stats.pts}</span><span>{p.stats.ast}</span><span>{p.stats.reb}</span><em>{p.heat}</em></button>)}</div>
      </section>

      <Scorekeeper players={players} setPlayers={setPlayers} />

      <section className="final-cta">
        <div><span>PLAYER ONE, ARE YOU READY?</span><h2>CREATE THE VERSION OF YOU<br/>THE CROWD <em>CAN'T FORGET.</em></h2><button className="primary-btn" onClick={() => setRegister(true)}>BUILD MY PLAYER <span>››</span></button></div>
      </section>
    </main>
    <footer><Logo small /><p>REAL HOOPS. UNREAL PERSONALITY.</p><div><button onClick={() => scrollTo('players')}>PLAYERS</button><button onClick={() => scrollTo('tour')}>TOUR</button><button onClick={() => scrollTo('rules')}>THE RULES</button></div><small>© 2026 FULL COURT CHAOS · ALL KIDS DESERVE A SPOTLIGHT</small></footer>
    <PlayerModal player={profile} onClose={() => setProfile(null)} />
    {register && <Registration onClose={() => setRegister(false)} onCreate={created} />}
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
