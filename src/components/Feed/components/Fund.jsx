import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { useMoralis, useMoralisQuery, useWeb3ExecuteFunction } from "react-moralis";
import { useEffect, useState, createElement } from "react";
import { Comment, Tooltip, Avatar, message, Divider } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import {CopyToClipboard} from 'react-copy-to-clipboard';

import Text from "antd/lib/typography/Text";
import Blockie from "components/Blockie";
import glStyles from "components/gstyles";
import Donations from "./Donations"
import Receivers from "./Receivers";
import Reputation from "components/Reputation";

const Fund = ({fund}) => {
    const {Moralis} = useMoralis();
    const { contentId, fundId, fundOwner, receivers } = fund;
    const [fundContent, setPosContent] = useState({ title: "default", content: "default" });
    const { data } = useMoralisQuery("Contents", (query) => query.equalTo("contentId", contentId));
    const [activeFund, setFundActive] = useState();
    const [endDate, setFundEndDate] = useState();

    const { data: isActive } = useMoralisQuery("FundsEnded", (query) => query.equalTo("fundId", fundId), [], {
        live: true,
    });
    
    const { walletAddress, contractABI, contractAddress, selectedCategory} = useMoralisDapp();
    const contractABIJson = JSON.parse(contractABI);
    const contractProcessor = useWeb3ExecuteFunction();
    const [donationAmount, setDonation] = useState("");
    const [userDonations, setUserDonations] = useState(0);

    useEffect(() => {
        function extractUri(data) {
          const fetchedContent = JSON.parse(JSON.stringify(data, ["contentUri"]));
          const contentUri = fetchedContent[0]["contentUri"];
          return contentUri;
        }
        async function fetchIPFSDoc(ipfsHash) {
          console.log(ipfsHash);
          const url = ipfsHash;
          const response = await fetch(url);
          return await response.json();
        }
        async function processContent() {
          const content = await fetchIPFSDoc(extractUri(data));
          setPosContent(content);
        }
        if (data.length > 0) {
          processContent();
        }
      }, [data]);
    
    useEffect(() => {
        async function getFundActive() {
            const fundActive = JSON.parse(JSON.stringify(isActive));
            setFundActive(fundActive?.length === 0);
            if(fundActive?.length > 0){
                setFundEndDate(new Date(fundActive[0]["createdAt"]).toDateString());
                console.log(endDate);
            }
            return;
        }

        getFundActive();
    }, [isActive, walletAddress]);

    useEffect(()=>{
        const options = {
            contractAddress: contractAddress,
            functionName: "getFund",
            abi: contractABIJson,
            params: {
              _fundId: fundId,
              _account: walletAddress
            }
          };
        async function getUserDonations() {
            await Moralis.enableWeb3;
            const result = await Moralis.executeFunction(options);
            setUserDonations(result / 1e18);
        }
        getUserDonations();
    },[]);
    

    async function Donate(amount){
        if (walletAddress.toLowerCase() === fundOwner.toLowerCase()) return message.error("You cannot donate to your own fund");
        const options = {
            contractAddress: contractAddress,
            functionName: "donate",
            abi: contractABIJson,
            msgValue: Moralis.Units.ETH(amount),
            params: {
              _fundId: fund["fundId"],
            },
          };
          await contractProcessor.fetch({
            params: options,
            onSuccess: () => message.success("Your donation has been received."),
            onError: (error) => console.error(error),
          });
    }

    async function endFundraiser(){
        if (walletAddress.toLowerCase() !== fundOwner.toLowerCase()) return message.error("Only the fund owner can end the fundraiser.");
        const options = {
            contractAddress: contractAddress,
            functionName: "endFund",
            abi: contractABIJson,
            params: {
              _fundId: fund["fundId"],
            },
          };
          await contractProcessor.fetch({
            params: options,
            onSuccess: () => message.success("The donation was succesfully ended"),
            onError: (error) => console.error(error),
          });
    }

    async function withrawFunding(){
        const options = {
            contractAddress: contractAddress,
            functionName: "withdrawFunding",
            abi: contractABIJson,
            params: {
              _fundId: fund["fundId"],
              //Add _ with new contract
              _receiver: walletAddress
            },
          };
          await contractProcessor.fetch({
            params: options,
            onSuccess: () => {
                console.log("success");
                message.success("Your earned donations have been succesfully withdrawn")
                clearForm();
            },
            onError: (error) => console.error(error),
          });
    }

    async function RetractDonation(){
        if (walletAddress.toLowerCase() === fundOwner.toLowerCase()) return message.error("You cannot retract from your own fund");
        const options = {
            contractAddress: contractAddress,
            functionName: "retractDonation",
            abi: contractABIJson,
            params: {
              _receiver: walletAddress,
              _fundId: fund["fundId"],
              _reputationTaken: 1,
            },
          };
          await contractProcessor.fetch({
            params: options,
            onSuccess: () => message.success("Your given donations have been succesfully retracted"),
            onError: (error) => console.error(error),
          });
    }

    const validateAmount = () => {
        let result = donationAmount > 0 ? true: false;
        return result
    }

   const clearForm = () =>{
        setDonation('');
    }
    
    function onSubmit(e){
        e.preventDefault();
        if(!validateAmount()){
            return message.error("You cannot donate nothing to the fundraiser.")
        }
        Donate(donationAmount);
        //clearForm();
    }
    
    const donateForm = () => {
        //should not display if the fund has ended
        if(activeFund){
            return (
            <Tooltip title="Donate to the fundraiser">
                <span style={{ fontSize: "15px", display: "flex", alignItems: "center" }}>      
                <form onSubmit={onSubmit}>
                    <div className ="row">
                        <div className="form-group">
                            <input
                            type="number"
                            step="0.01"
                            className="mb-2 mt-2 form-control"
                            placeholder="Donation Amount (ETH)"
                            value={donationAmount}
                            onChange={(e) => setDonation(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-dark ">Donate</button>
                    </div>
                </form>
                </span>
            </Tooltip>
            );
        }
        else {
            return(
                <span style={{ fontSize: "15px", display:"flex", width: "100%", float:"left", marginRight:"100px" }}> 
                    This fundraiser ended on {endDate}
                </span>
            );
        }
    }

    const retractDonationsButton = () => {
        //should not display if the fund has ended
        if(activeFund && userDonations > 0){
            return (
                <Tooltip title="Retract all donations given">
                    <span style={{ fontSize: "15px", display: "list-item", alignItems: "center", marginLeft:"320px", marginTop:"20px" }}>
                        {/* This should display the total fundraising given by this user*/}  
                        <button className="btn btn-dark " onClick={() => RetractDonation()}>Retract Donations</button>
                    </span>
                </Tooltip>
            );
        }
    }
    const fundOwnerCapabilites = () => {
        //should not display if the fund has ended
        if(activeFund && walletAddress === fundOwner){
            return (
                <Tooltip title="End the fundraiser and allow receivers to start withdrawing.">
                    <span style={{marginTop:"0px", marginLeft:"12px", float:"left" }}>
                        <button className="btn btn-dark " style={{float:"right", marginTop:"10px"}} onClick={() => endFundraiser()}>End Fundraiser</button>
                    </span>
                </Tooltip>
            );
        }
    }

    const receiverCapabilites = () => {
        //should not display if the fund is active
        if(!activeFund && receivers.find(r => r.toLowerCase() === walletAddress.toLowerCase())){
            return (
                <Tooltip title="Withdraw the donations given to you.">
                    <button className="btn btn-dark " style={{float:"right", marginTop:"10px"}} onClick={() => withrawFunding()}>Withdraw Donated Funds</button>
                </Tooltip>
            );
        }
    }

    const actions = [
    <Tooltip title="The amount raised so far for the fundraiser.">
        <br></br>
        <span style={{ fontSize: "20px", display:"flex", width: "100%", float:"left", marginRight:"100px" }}> 
            Total Donations:
            <Donations fundId={fundId}/>
        </span>
    </Tooltip>,
    <Tooltip title="The addresses who will receive the donations when the fundraiser is complete.">
        <span style={{ fontSize: "12px" }}> 
            Fundraiser Receivers:
            <Receivers fundId={fundId}/>
        </span>
    </Tooltip>,
    donateForm(),
    retractDonationsButton(),
    fundOwnerCapabilites(),
    receiverCapabilites()
    ];  

    const loading = "";
    
    //Add a copy direct link to search a each fundraiser for sharing

    const result = (
        <Comment
        style={{ ...glStyles.card, padding: "0px 15px", marginBottom: "10px" }}
        actions={actions}
        author={<Text strong>{fund["fundOwner"]}</Text>}
        avatar={<Avatar src={<Blockie address={fund["fundOwner"]} scale={4} />}></Avatar>}
        content={
            <>
            <Text strong style={{ fontSize: "12px", color: "#333" }}>
                {"The Organizers Reputation in "} {selectedCategory["category"]} {" is "}
                <Reputation address={fund["fundOwner"]}></Reputation>
                <br></br>
                <br></br>

            </Text>
            <Text strong style={{ fontSize: "20px", color: "#333" }}>
                {fundContent["title"]}
            </Text>
            <CopyToClipboard text={window.location.origin + window.location.pathname + "?categoryId=" + selectedCategory["categoryId"] + "&fundId=" + fundId}
            onCopy={() => message.success("Copied to Clipboard")}
            >
                <button
                style={{ fontSize: "15px", alignItems: "center", marginLeft: "16px" }}>
                {createElement(LinkOutlined)} Copy Link
                </button>      
            </CopyToClipboard>
            <p style={{ fontSize: "15px", color: "#111", marginTop:"10px"}}>{fundContent["content"]}</p>
            <Divider style={{ margin: "15px 0" }} />
            </>
        }
      />
    )
    
    
    return fundContent["title"] === "default" ? loading : result;
}

export default Fund
