import React from "react";
import Link from "next/link";


const Home = () => {
  return (
    <div className="bg-[#DAD7B6] min-h-screen text-[#545334] px-6 py-12">
      {/* HERO */}
      <section className="max-w-6xl mx-auto text-center mb-20">
        <h1 className="text-5xl font-extrabold mb-6">ConnectNGO</h1>
        <p className="text-lg max-w-2xl mx-auto">
          A citizen-driven platform using <span className="font-semibold">AI and geolocation</span> to bridge the communication gap between
          people and NGOs for <span className="font-semibold">timely, contextual action</span>.
        </p>
      </section>

      {/* WHY IT'S NEEDED */}
      <section className="max-w-6xl mx-auto mb-20">
        <div className="bg-white/30 backdrop-blur-[50px] rounded-2xl p-6 shadow items-center">
          <h2 className="text-4xl max-w-6xl font-bold mb-4 text-center">Why this platform?</h2>
          <p className="text-2xl">
            Social issues often go <strong>unnoticed</strong> or <strong>unaddressed</strong> due to communication gaps.
            ConnectNGO bridges that divide, enabling <strong>concerned citizens</strong> to report problems and
            connect them with the <strong>right NGOs</strong> for fast and efficient action.
          </p>
        </div>

        <div className="bg-white/30 backdrop-blur-[50px] rounded-2xl p-6 shadow mt-10 items-center">
          <h2 className="text-3xl font-bold mb-4 text-center">How it solves real problems</h2>
          <p className="text-2xl">
            With geolocation and AI, the platform automatically matches issues with the <strong>most relevant NGO</strong> in the area,
            ensuring that no time is wasted and confusion is avoided.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto mb-20">
        <h2 className="text-4xl font-bold text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white/30 rounded-2xl p-6 backdrop-blur-[50px] shadow">
            <h3 className="text-xl font-semibold mb-2">1. Citizen Reporting (via Discord)</h3>
            <p>
              Citizens join our Discord and verify via <code className="bg-[#DAD7B6] px-1 py-[1px] rounded">/verify</code>. 
              They report issues with <code className="bg-[#DAD7B6] px-1 py-[1px] rounded">/report</code>, submitting 
              descriptions, media, and location.
            </p>
          </div>

          <div className="bg-white/30 backdrop-blur-[50px] rounded-2xl p-6 shadow">
            <h3 className="text-xl font-semibold mb-2">2. AI + Geolocation Matching</h3>
            <p>
              The AI agent filters NGOs by location and issue type, automatically selecting the best fit for the case.
              This ensures <strong>targeted and accurate delivery</strong> of every report.
            </p>
          </div>

          <div className="bg-white/30 backdrop-blur-[50px] rounded-2xl p-6 shadow">
            <h3 className="text-xl font-semibold mb-2">3. NGO Dashboard</h3>
            <p>
              NGOs log into their dedicated dashboard to see incoming cases, respond, assign internal tasks, and 
              update statuses. Every report includes <strong>structured info</strong>, media, and location.
            </p>
          </div>

          <div className="bg-white/30 backdrop-blur-[50px] rounded-2xl p-6 shadow">
            <h3 className="text-xl font-semibold mb-2">4. Reputation Scoring</h3>
            <p>
              NGOs are ranked using a smart scoring system based on performance. Only the <strong>top-scoring NGO</strong> 
              is assigned a task, encouraging competition and accountability.
            </p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="text-center">
        <h2 className="text-4xl font-bold mb-4">Be the change. Join ConnectNGO.</h2>
        <p className="mb-6 text-3xl">Start reporting issues or register your NGO to receive meaningful, local tasks.</p>
        <div className="flex justify-center gap-4">
          <button className="border-2 border-[#545334] text-[#545334] px-8 py-4 rounded-lg hover:bg-[#545334] hover:text-[#DAD7B6] transition text-2xl">
            Login
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;

