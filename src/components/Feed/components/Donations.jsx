import { useState, useEffect } from "react";
import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { useMoralis, useMoralisQuery } from "react-moralis";


const Donations = ({fundId}) => {
    const {Moralis} = useMoralis();
    const [donations, setDonations] = useState("0");
    const { contractABI, contractAddress} = useMoralisDapp();
    const contractABIJson = JSON.parse(contractABI)
    
    const { data } = useMoralisQuery("Donations", (query) => query.equalTo("fundId", fundId), [], { live: true });
    const options = {
        contractAddress: contractAddress,
        functionName: "getFund",
        abi: contractABIJson,
        params: {
          _fundId: fundId
        }
      };
    
    useEffect(() => {
        async function getDonations() {
            await Moralis.enableWeb3;
            const result = await Moralis.executeFunction(options);
            setDonations(result[6] / 1e18);
        }
        getDonations();
    }, [data]);
    
    return (
        <>
          {donations}  
        </>
    )
}

export default Donations
