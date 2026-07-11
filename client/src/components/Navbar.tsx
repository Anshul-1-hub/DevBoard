import { Link } from "react-router-dom"
import { authClient } from "../lib/auth-client"

type NavbarProps = {
    signOut: () => Promise<void>;
}

export function Navbar({signOut} : NavbarProps){
    const { data:session } = authClient.useSession();
    const { data: activeOrg } = authClient.useActiveOrganization();
    return(
        <>
        {activeOrg ? (
            <div className="h-16 flex items-center bg-bg px-6">
                <div className="font-medium text-xl gap-3 flex-1">
                    <Link to="/dashboard">
                        <span className="text-primary">Dev</span>
                        <span className="text-secondary">Board</span>
                    </Link>
                </div>
                <div className="flex items-center gap-6 text-secondary justify-center flex-1">
                    <Link to="/board">Board</Link>
                    <Link to="/activity">Activity</Link>
                    <Link to="/members">Members</Link>
                </div>
                <div className="flex items-center gap-4 justify-end flex-1">
                    <span className="text-secondary">{session?.user.name}</span>
                    <button onClick={signOut} className="bg-primary hover:cursor-pointer rounded-lg py-1 px-2 hover:bg-primary-hover"><span className="font-medium">Sign Out</span></button>
                </div>
            </div>
        ) : (
            <div className="h-16 flex items-center bg-bg px-6">
                <div className="font-medium text-xl gap-3 flex-1">
                    <Link to="/dashboard">
                        <span className="text-primary">Dev</span>
                        <span className="text-secondary">Board</span>
                    </Link>
                </div>
                <button onClick={signOut} className="bg-primary hover:cursor-pointer rounded-lg py-1 px-2 font-medium hover:bg-primary-hover">Sign Out</button>
            </div>
        )}
        </>
    )
}