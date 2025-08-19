from violet.log import get_logger
from violet.schemas.organization import Organization
from violet.services.organization_manager import OrganizationManager

logger = get_logger(__name__)


def setup():
    org_manager = OrganizationManager()
    default_org = None

    try:
        default_org = org_manager.get_default_organization()
    except Exception as e:
        logger.error("not found default organization.")

    if default_org is None:
        default_org = org_manager.create_organization(
            Organization(id=org_manager.DEFAULT_ORG_ID, name=org_manager.DEFAULT_ORG_ID))
