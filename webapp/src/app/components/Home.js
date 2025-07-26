import reacrt from 'react';
import Link from 'next/link';

const Home = () => {
	return (
<div className="min-h-screen bg-[#DAD7B6] flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-4xl md:text-5xl font-bold text-[#545334] text-center mb-6">
        Welcome to ConnectNGO
      </h1>

      <p className="text-lg md:text-xl text-[#545334] max-w-3xl text-center mb-8">
        In a society where social issues often go unnoticed or unaddressed due to communication gaps,
        <span className="font-semibold"> our platform bridges the divide between concerned citizens and active NGOs.</span>
        Whether it's reporting a problem or volunteering for change, this platform empowers people to take action with the right partners.
      </p>
	<Link href="/login"  className="bg-[#545334] text-[#DAD7B6] px-6 py-3 rounded-md text-lg hover:bg-[#434323] transition">
	  Get Started
	  </Link>
      <footer className="mt-16 text-sm text-[#545334]">
        © 2025 ConnectNGO. All rights reserved.
      </footer>
    </div>
				
	);
}
export default Home;
