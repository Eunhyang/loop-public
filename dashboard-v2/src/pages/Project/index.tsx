import { useParams } from 'react-router-dom';

export const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Project: {id}</h1>
      <p className="text-gray-600">Project detail page placeholder</p>
    </div>
  );
};
