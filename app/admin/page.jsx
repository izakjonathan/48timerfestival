import Editor from './editor.jsx';
import './editor.css';

export const metadata = { title: 'Festival editor', robots: { index: false, follow: false } };

export default function Admin() {
  return <Editor />;
}
