import Image from "next/image";
import SearchForm from "@/components/SearchForm";
import StartupCard from "@/components/StartupCard";


export default async function Home( { searchParams }: { searchParams: Promise<{ query?: string }> } ) {
    const query = (await searchParams).query;

    //const post = await client.fetch(STARTUPS_QUERY);

    const posts = [{
        _createdAt: new Date(),
        views: 55,
        author: { _id: 1, name: 'Adrian' },
        _id: 1,
        title: 'HahaZen',
        category: 'Startup',
        description: 'This is a description.',
        image: 'https://lip.tj/upload/iblock/ef4/ef42afd1cd8cf4325b325bccd33b8bdd.jpg'
    }];

  return (
   <>
       <section className="pink_container">
           <h1 className="heading">Home</h1>

           <p className="sub-heading !max-w-3xl">
               Submit Ideas, Vote on Pitches, and Get Noticed in Virtual Competitions.
           </p>

           <SearchForm query={query}/>
       </section>

       <section className="section_container">
           <p className="text-30-semibold">
               {query ? `Search Results for "${query}"` : "HahaZen"}
           </p>

           <ul className="mt-7 card_grid">
               {posts?.length > 0 ? (
                   posts.map(( post) => (
                       <StartupCard  key={post?._id} post={post}/>
                   ))
               ) : (
                   <p className="no-result"> No startups found</p>
               )}
           </ul>
       </section>
   </>
  );
}
