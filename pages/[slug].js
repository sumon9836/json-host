
import { getDatabase, ref, get } from 'firebase/database';
import { database } from '../lib/firebaseClient';

export default function JsonPage({ data, error }) {
  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>404 - Not Found</h1>
        <p>{error}</p>
      </div>
    );
  }

  return null;
}

export async function getServerSideProps(context) {
  const { slug } = context.params;

  try {
    const dbRef = ref(database, `jsons/${slug}`);
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) {
      return {
        props: {
          error: 'JSON not found'
        }
      };
    }

    const record = snapshot.val();

    context.res.setHeader('Content-Type', 'application/json');
    context.res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    context.res.write(JSON.stringify(record.payload, null, 2));
    context.res.end();

    return { props: {} };
  } catch (err) {
    return {
      props: {
        error: err.message
      }
    };
  }
}
