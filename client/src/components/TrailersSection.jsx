import React, { useState } from "react";
import ReactPlayer from "react-player";
import { PlayCircleIcon } from "lucide-react";
import { dummyTrailers } from "../assets/assets";

const TrailersSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20">
      <p className="text-gray-300 font-medium text-lg text-center">Trailers</p>

      <div className="relative mt-6 flex justify-center">
        <ReactPlayer
          key={currentTrailer.videoUrl}
          url={currentTrailer.videoUrl}
          playing
          muted
          controls
          width="960px"
          height="540px"
          className="mx-auto max-w-full rounded-xl overflow-hidden"
          config={{
            youtube: {
              playerVars: { showinfo: 1 },
            },
          }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
        {dummyTrailers.map((trailer) => (
          <div
            key={trailer.image}
            onClick={() => setCurrentTrailer(trailer)}
            className={`relative cursor-pointer transition transform hover:scale-105 ${
              currentTrailer.videoUrl === trailer.videoUrl
                ? "ring-2 ring-red-500"
                : ""
            }`}
          >
            <img
              src={trailer.image}
              alt="Trailer Thumbnail"
              className="rounded-lg w-full h-full object-cover brightness-75"
            />
            <PlayCircleIcon className="absolute top-1/2 left-1/2 w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 text-white opacity-90" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailersSection;
