import FaultyTerminal from "@/components/FaultyTerminal";

const Home = () => {
  return (
    <>
      <div style={{ width: '100vw', height: '100svh', position: 'fixed', zIndex: 0 }}>
        <FaultyTerminal
          scale={1.5}
          digitSize={1.2}
          scanlineIntensity={0.5}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          dither={0}
          curvature={0.1}
          tint="#545454"
          mouseReact
          mouseStrength={0.5}
          brightness={0.6}
        />
      </div>

      <div className='music-pill' style={{ zIndex: 999 }}>
      </div>

      <div className='content' style={{ zIndex: 1 }}>
        <div className='hero'>
          <div className='hero-content'>
            <h1 className='bitcount-prop-single'> Crucible </h1>
            <p className='bitcount subtitle'> Student · Developer </p>
          </div>
        </div>
        <div className='gist-bento'>
          <div className='gist-card bitcount' id='streak'>
            <h3><span className='bitcount-grid-single big-num' id='streak-days'>12</span><span>Days</span></h3>
            <p className='subtext'> Current Streak </p>
          </div>
          <div className='gist-card bitcount' id='commits'>
            <h3><span className='bitcount-grid-single big-num' id='commit-count'>142</span><span>Commits</span></h3>
            <p className='subtext'> This Month </p>
          </div>
          <div className='gist-card bitcount-grid-single' id='time'><span className='time-text'>13<br/>02</span></div>
          <div className='gist-card bitcount' id='gist'><h3> Something about me </h3> <p className='inter about-me'>I spend most of my time building, learning, and asking questions. Interested in software, startups, and opportunities beyond the path I'm expected to follow.</p> </div>
          <div className='gist-card' id='icons'>
            <p className='bitcount-prop-single subtext' style={{ lineHeight: 1, }}>"We act as mortals in our fears and immortals in our desires."</p>
          </div>
        </div>


        {/* <div className='ascii-section' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className='pixelify-sans'> Daily ASCII Image </h3>
          <div className='ascii-container'>
            <img src={AsciiPfp} alt='Ascii Image' />
          </div>
        </div> */}

      </div>
    </>
  );
};

export default Home;
