export { defineQuery } from 'next-sanity';


export const STRUCTURE_QUERY =
    defineQuery(`*[_type == "startup" && defined(slug.current)] | order(_createAt desc) {
  _id,
  title,
  slug, 
  _createAt, 
  author -> {
    _id, name, slug, image, bio
  }, 
  views, 
  description, 
  category, 
  image
}`);
