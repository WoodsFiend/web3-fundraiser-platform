import { useState, useEffect } from "react";
import { useMoralisQuery } from "react-moralis";


const Receivers = ({fundId}) => {
    const [receivers, setReceivers] = useState("");

    const queryFund = useMoralisQuery("Funds", (query) => query.equalTo("fundId", fundId), [], { live: true });
    const fetchedFunds = JSON.parse(JSON.stringify(queryFund.data)).reverse();
    
    useEffect(() => {
        async function getReceivers() {
            try{
                setReceivers(fetchedFunds[0].receivers.toString().replace(",","\n"));
            }
            catch(err){
                setReceivers("None");
            }
        }
        getReceivers();
    }, [queryFund, fetchedFunds]);
    
    return (
        <div style={{whiteSpace: "pre-line"}}>
          {receivers}
        </div>
    )
}

export default Receivers
