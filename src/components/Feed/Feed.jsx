import {useMoralisDapp} from "providers/MoralisDappProvider/MoralisDappProvider"
import {useState} from "react"
import Funds from "./components/Funds"
import Reputation from "components/Reputation"

import {Avatar, Button }from "antd" 
import glStyles from "components/gstyles"
import Blockie from "components/Blockie"
import CreateFund from "./components/CreateFund"

const Feed = () => {
    const {walletAddress, selectedCategory} = useMoralisDapp();
    const [showAddFund, setShowAddFund] = useState(false)

    let result = null;
    
    function toogleShowAddFund(){
        setShowAddFund(!showAddFund);
    }

    if (selectedCategory["category"] === "default") {
        result = (
          <div className="col-lg-9">
            <h3>Choose a Category</h3>
          </div>
        );
      }
    else {
        result = (
        <div className="col-lg-9">
            <div
                style={{
                    ...glStyles.card,
                    padding: "10px 13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Avatar src={<Blockie currentWallet />} />
                <h4> Your Reputation in {selectedCategory["category"]} is <Reputation address={walletAddress}/> </h4>
                <Button shape="round" onClick={toogleShowAddFund}>
                    Fundraise
                </Button>
            </div>
            {showAddFund ? <CreateFund/>:""}
            <Funds/>
        </div>    
        )
    }
    
    return result;
}

export default Feed
