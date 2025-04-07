'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Bus,
  Clock,
  Search,
  ArrowRight,
  Download,
} from 'lucide-react';
import Image from 'next/image';

/**
 * Component displaying Instagram launch post graphics for the Safar app
 */
export default function InstagramLaunchPosts() {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    post1: false,
    post2: false,
    post3: false,
  });

  /**
   * Handles downloading a post image by calling the server-side API
   */
  const handleDownload = async (postId: string) => {
    try {
      setIsLoading({ ...isLoading, [postId]: true });

      // Call the API to generate the image
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate image');
      }

      const data = await response.json();

      // Create a link to download the image
      const link = document.createElement('a');
      link.href = data.imageUrl;
      link.download = `safar-instagram-${postId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Image downloaded successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    } finally {
      setIsLoading({ ...isLoading, [postId]: false });
    }
  };

  return (
    <div className="flex flex-col gap-12 p-4">
      <h1 className="text-2xl font-bold">Instagram Launch Posts</h1>
      <p className="text-gray-600 mb-6">
        Professional promotional graphics for Safar app launch campaign
      </p>
      <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800 text-sm">
          <strong>Note:</strong> For high-quality 1080×1080 images, we&apos;re
          using server-side rendering. Clicking download will process the image
          and open it in a new tab where you can save it.
        </p>
      </div>

      {/* Vertical layout for the posts */}
      <div className="flex flex-col space-y-16 items-center">
        {/* POST 1: Main Launch Announcement */}
        <div
          id="post1-container"
          className="relative w-full max-w-[600px] h-[600px] rounded-xl overflow-hidden border border-gray-200 shadow-lg flex flex-col items-center justify-center"
        >
          <div className="absolute inset-0 bg-[#004d3a] bg-opacity-90">
            <div className="absolute inset-0 opacity-20 bg-radial-gradient-accent"></div>
          </div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-700">
              Post 1: Main Launch Announcement
            </h2>
            <button
              onClick={() => handleDownload('post1')}
              className="flex items-center gap-1.5 bg-[#00a67e] hover:bg-[#009670] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
            >
              <Download size={16} />
              <span>Download 1080×1080</span>
            </button>
          </div>
          <div
            id="instagram-post-1"
            className="w-full aspect-square bg-[#004036] relative overflow-hidden shadow-xl rounded-lg border-8 border-white ring-1 ring-gray-200"
          >
            {/* Subtle map gradient */}
            <div className="absolute inset-0 bg-gradient-radial from-[#005346] to-[#004036] opacity-30"></div>
            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-tr from-[#00a67e]/5 to-transparent"></div>

            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[#00a67e]/5 blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-[#00a67e]/5 blur-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00a67e]/30 to-transparent"></div>

            {/* Content container with new layout structure and better spacing */}
            <div className="flex flex-col h-full relative z-10">
              {/* Top section with logo and badge */}
              <div className="pt-6 sm:pt-8 pb-2 px-6 sm:px-8 flex flex-col items-center">
                <div className="w-14 md:w-16 h-14 md:h-16 bg-white/10 backdrop-blur-sm rounded-full p-1 flex items-center justify-center shadow-lg mb-3">
                  <Image
                    src="/images/icons/safar-logo.svg"
                    alt="Safar Logo"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                <div className="inline-block py-1 px-4 rounded-full bg-[#00a67e]/15 text-[#00a67e] text-xs font-medium tracking-wider shadow-sm">
                  NOW AVAILABLE
                </div>
              </div>

              {/* Middle section with main content */}
              <div className="flex-grow px-4 sm:px-6 flex flex-col items-center justify-center text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3 tracking-tight">
                  Find Your <span className="text-[#00a67e]">Safar</span>
                </h2>

                <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-xs mx-auto mb-4 leading-relaxed">
                  Navigate Islamabad&apos;s public transportation with ease
                </p>

                <div className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/10 mb-2 mx-auto w-full max-w-[250px] sm:max-w-xs shadow-xl">
                  <div className="flex items-center justify-center space-x-4 mb-2">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-[#00a67e] rounded-full flex items-center justify-center shadow-lg transition-transform duration-300">
                      <MapPin size={16} className="text-white" />
                    </div>
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-[#00a67e] rounded-full flex items-center justify-center shadow-lg transition-transform duration-300">
                      <Navigation size={16} className="text-white" />
                    </div>
                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-[#00a67e] rounded-full flex items-center justify-center shadow-lg transition-transform duration-300">
                      <Search size={16} className="text-white" />
                    </div>
                  </div>
                  <p className="text-white/90 text-xs sm:text-sm font-medium">
                    Smart route planning for your daily commute
                  </p>
                </div>
              </div>

              {/* Bottom section with footer */}
              <div className="pb-5 sm:pb-6 pt-3 px-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-0.5 w-14 bg-[#00a67e]/30 rounded-full"></div>
                  <div className="h-0.5 w-6 bg-[#00a67e] rounded-full"></div>
                  <div className="h-0.5 w-14 bg-[#00a67e]/30 rounded-full"></div>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-white/80 text-xs font-medium">
                    www.safar.fyi
                  </p>
                  <p className="text-white/80 text-xs font-medium">
                    @safar.fyi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POST 2: How It Works */}
        <div
          id="post2-container"
          className="relative w-full max-w-[600px] h-[600px] rounded-xl overflow-hidden border border-gray-200 shadow-lg flex flex-col items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#f1efe3] to-[#e6e2d2]">
            {/* Subtle transit line pattern */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00a67e]/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00a67e]/30 to-transparent"></div>
            </div>

            {/* Subtle transit lines */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-[20%] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00a67e]/20 to-transparent"></div>
              <div className="absolute top-[40%] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#FFB546]/20 to-transparent"></div>
              <div className="absolute top-[60%] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#FF5757]/20 to-transparent"></div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-700">
                Post 2: How It Works
              </h2>
              <button
                onClick={() => handleDownload('post2')}
                className="flex items-center gap-1.5 bg-[#00a67e] hover:bg-[#009670] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
              >
                <Download size={16} />
                <span>Download 1080×1080</span>
              </button>
            </div>
            <div
              id="instagram-post-2"
              className="w-full aspect-square bg-gradient-to-br from-[#004036] to-[#005346] relative overflow-hidden shadow-xl rounded-lg border-8 border-white ring-1 ring-gray-200"
            >
              {/* Decorative elements */}
              <div className="absolute inset-0 bg-[url('/images/icons/pattern-dot.png')] bg-repeat opacity-5"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00a67e]/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00a67e]/30 to-transparent"></div>

              {/* Content container with new layout structure and better spacing */}
              <div className="flex flex-col h-full relative z-10">
                {/* Top section with logo and badge */}
                <div className="pt-6 sm:pt-8 pb-2 px-6 sm:px-8 flex flex-col items-center">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full p-1 flex items-center justify-center shadow-lg mb-2">
                    <Image
                      src="/images/icons/safar-logo.svg"
                      alt="Safar Logo"
                      width={30}
                      height={30}
                      className="object-contain"
                    />
                  </div>
                  <div className="inline-block py-1 px-3 rounded-full bg-[#00a67e]/15 text-[#00a67e] text-xs font-medium tracking-wider shadow-sm">
                    HOW IT WORKS
                  </div>
                </div>

                {/* Middle section with main content */}
                <div className="flex-grow px-4 sm:px-6 py-2 flex flex-col items-center justify-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 tracking-tight text-center">
                    Find Your Perfect{' '}
                    <span className="text-[#00a67e]">Route</span>
                  </h2>

                  <div className="space-y-2 sm:space-y-3 w-full max-w-[280px] mx-auto">
                    <div className="flex items-center group">
                      <div className="w-8 sm:w-9 h-8 sm:h-9 bg-[#00a67e] text-white rounded-full flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3 shadow-lg group-hover:shadow-[#00a67e]/30 transition-shadow duration-300">
                        <div className="font-bold text-sm sm:text-base">1</div>
                      </div>
                      <div className="flex-1 bg-white/10 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-white/20 text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="font-semibold text-white text-xs sm:text-sm mb-0.5">
                          Enter Locations
                        </div>
                        <div className="text-white/70 text-xs">
                          Start and destination points
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center group">
                      <div className="w-8 sm:w-9 h-8 sm:h-9 bg-[#00a67e] text-white rounded-full flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3 shadow-lg group-hover:shadow-[#00a67e]/30 transition-shadow duration-300">
                        <div className="font-bold text-sm sm:text-base">2</div>
                      </div>
                      <div className="flex-1 bg-white/10 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-white/20 text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="font-semibold text-white text-xs sm:text-sm mb-0.5">
                          Choose a Route
                        </div>
                        <div className="text-white/70 text-xs">
                          Select from optimal options
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center group">
                      <div className="w-8 sm:w-9 h-8 sm:h-9 bg-[#00a67e] text-white rounded-full flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3 shadow-lg group-hover:shadow-[#00a67e]/30 transition-shadow duration-300">
                        <div className="font-bold text-sm sm:text-base">3</div>
                      </div>
                      <div className="flex-1 bg-white/10 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-white/20 text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="font-semibold text-white text-xs sm:text-sm mb-0.5">
                          Get Directions
                        </div>
                        <div className="text-white/70 text-xs">
                          Step-by-step journey guidance
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom section with footer */}
                <div className="pb-5 sm:pb-6 pt-3 px-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-0.5 w-14 bg-[#00a67e]/30 rounded-full"></div>
                    <div className="h-0.5 w-6 bg-[#00a67e] rounded-full"></div>
                    <div className="h-0.5 w-14 bg-[#00a67e]/30 rounded-full"></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-white/80 text-xs font-medium">
                      www.safar.fyi
                    </p>
                    <p className="text-white/80 text-xs font-medium">
                      @safar.fyi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POST 3: Interactive Map */}
        <div
          id="post3-container"
          className="relative w-full max-w-[600px] h-[600px] rounded-xl overflow-hidden border border-gray-200 shadow-lg flex flex-col items-center justify-center"
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-700">
              Post 3: Interactive Map
            </h2>
            <button
              onClick={() => handleDownload('post3')}
              className="flex items-center gap-1.5 bg-[#00a67e] hover:bg-[#009670] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
            >
              <Download size={16} />
              <span>Download 1080×1080</span>
            </button>
          </div>

          <div
            id="instagram-post-3"
            className="w-full aspect-square relative overflow-hidden shadow-xl rounded-lg border-8 border-white ring-1 ring-gray-200"
          >
            <div className="absolute inset-0 bg-[#f7f5ec]">
              {/* Subtle transit map background */}
              <div className="absolute inset-0 opacity-[0.05]">
                <div className="absolute inset-0 bg-[url('/images/icons/pattern-dot.png')] bg-repeat opacity-5"></div>
                <div className="absolute inset-0 bg-gradient-radial from-[#F8EFDE] to-[#FEF6EC] opacity-60"></div>
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-[#00a67e]/5 to-transparent rounded-full"></div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-5 left-5 w-32 h-32 rounded-full bg-[#00a67e]/5 blur-3xl"></div>
              <div className="absolute bottom-5 right-5 w-48 h-48 rounded-full bg-[#00a67e]/5 blur-3xl"></div>
            </div>

            {/* Content container with new layout structure and better spacing */}
            <div className="flex flex-col h-full relative z-10">
              {/* Top section with logo and badge */}
              <div className="pt-6 sm:pt-8 pb-2 px-6 sm:px-8 flex flex-col items-center">
                <div className="w-12 h-12 bg-white shadow-md rounded-full p-1 flex items-center justify-center mb-2">
                  <Image
                    src="/images/icons/safar-logo.svg"
                    alt="Safar Logo"
                    width={30}
                    height={30}
                    className="object-contain"
                  />
                </div>
                <div className="inline-block py-1 px-3 rounded-full bg-[#00a67e]/15 text-[#00a67e] text-xs font-medium tracking-wider shadow-sm">
                  INTERACTIVE MAP
                </div>
              </div>

              {/* Middle section with main content */}
              <div className="flex-grow px-3 sm:px-5 py-2 flex flex-col items-center justify-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 tracking-tight text-center">
                  Explore Our{' '}
                  <span className="text-[#00a67e]">Transit Map</span>
                </h2>

                <div className="relative mx-auto mb-3 bg-white rounded-xl p-2 sm:p-3 shadow-xl w-48 sm:w-56 h-48 sm:h-56 border border-gray-200">
                  <div className="absolute inset-0 m-2 sm:m-3 rounded-lg overflow-hidden bg-[#f5f5f5]">
                    <div className="absolute top-1/4 left-0 w-full h-2 bg-[#00a67e]/70"></div>
                    <div className="absolute top-2/4 left-0 w-full h-2 bg-[#FFB546]/70"></div>
                    <div className="absolute top-3/4 left-0 w-full h-2 bg-[#FF5757]/70"></div>

                    <div className="absolute top-1/4 left-1/4 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white border-2 border-[#00a67e] shadow-md transform hover:scale-110 transition-transform duration-300"></div>
                    <div className="absolute top-2/4 right-1/4 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white border-2 border-[#FFB546] shadow-md transform hover:scale-110 transition-transform duration-300"></div>
                    <div className="absolute top-3/4 left-1/3 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white border-2 border-[#FF5757] shadow-md transform hover:scale-110 transition-transform duration-300"></div>

                    {/* Map decorative elements */}
                    <div className="absolute top-1/5 right-1/4 w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-gray-300"></div>
                    <div className="absolute top-1/3 left-1/5 w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-gray-300"></div>
                    <div className="absolute bottom-1/4 right-1/3 w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-gray-300"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-[280px] mx-auto mb-3">
                  <div className="bg-white p-2 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center mb-1">
                      <div className="w-6 h-6 bg-[#00a67e]/10 rounded-full flex items-center justify-center mr-1.5">
                        <Clock size={12} className="text-[#00a67e]" />
                      </div>
                      <h3 className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                        Real-Time Updates
                      </h3>
                    </div>
                    <p className="text-gray-600 text-xs">
                      Live transit schedules
                    </p>
                  </div>

                  <div className="bg-white p-2 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center mb-1">
                      <div className="w-6 h-6 bg-[#00a67e]/10 rounded-full flex items-center justify-center mr-1.5">
                        <Bus size={12} className="text-[#00a67e]" />
                      </div>
                      <h3 className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                        All Routes
                      </h3>
                    </div>
                    <p className="text-gray-600 text-xs">Metro coverage</p>
                  </div>
                </div>

                <button className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#004036] text-white rounded-lg shadow-lg hover:bg-[#003830] transition-colors duration-300 text-xs sm:text-sm">
                  <span className="mr-1.5 font-medium">Explore the Map</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Bottom section with footer */}
              <div className="pb-5 sm:pb-6 pt-3 px-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-0.5 w-14 bg-[#00a67e]/30 rounded-full"></div>
                  <div className="h-0.5 w-6 bg-[#00a67e] rounded-full"></div>
                  <div className="h-0.5 w-14 bg-[#00a67e]/30 rounded-full"></div>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-gray-600 text-xs font-medium">
                    www.safar.fyi
                  </p>
                  <p className="text-gray-600 text-xs font-medium">
                    @safar.fyi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <p className="text-center text-sm text-gray-500">
          Click on a post to download a high-quality 1080×1080 image for
          Instagram
        </p>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => handleDownload('post1')}
            className="px-4 py-2 bg-[#00a67e] text-white rounded-md hover:bg-[#008f6c] transition-colors"
            disabled={isLoading.post1}
          >
            {isLoading.post1 ? 'Processing...' : 'Download Post 1'}
          </button>
          <button
            onClick={() => handleDownload('post2')}
            className="px-4 py-2 bg-[#00a67e] text-white rounded-md hover:bg-[#008f6c] transition-colors"
            disabled={isLoading.post2}
          >
            {isLoading.post2 ? 'Processing...' : 'Download Post 2'}
          </button>
          <button
            onClick={() => handleDownload('post3')}
            className="px-4 py-2 bg-[#00a67e] text-white rounded-md hover:bg-[#008f6c] transition-colors"
            disabled={isLoading.post3}
          >
            {isLoading.post3 ? 'Processing...' : 'Download Post 3'}
          </button>
        </div>
      </div>
    </div>
  );
}
