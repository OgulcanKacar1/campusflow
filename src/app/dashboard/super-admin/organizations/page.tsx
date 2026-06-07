import { getOrganizationsWithDomains } from '../actions';
import OrganizationList from '../OrganizationList';

export default async function OrganizationsPage() {
  const organizations = await getOrganizationsWithDomains();

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <OrganizationList organizations={organizations} />
      </div>
    </div>
  );
}
