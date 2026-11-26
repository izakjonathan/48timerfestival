import {absolute} from '../lib/seo.js';
export default function robots(){return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/api/']},sitemap:absolute('/sitemap.xml')};}
