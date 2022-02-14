import {useMoralisDapp} from "providers/MoralisDappProvider/MoralisDappProvider";
import {useMoralisFile} from "react-moralis";
import {useWeb3ExecuteFunction} from "react-moralis";
import {useState} from "react";
import {message} from "antd";

const CreateFund = () => {
    const {contractABI, contractAddress, selectedCategory} = useMoralisDapp();
    const contractABIJson = JSON.parse(contractABI);
    const ipfsProcessor = useMoralisFile();
    const contractProcessor = useWeb3ExecuteFunction();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [receivers, setReceivers] = useState("");

    async function createFund(post) {
        const contentUri = await processContent(post); 
        const categoryId = selectedCategory["categoryId"];
        const options = {
            contractAddress: contractAddress,
            functionName: "createFund",
            abi: contractABIJson,
            params: {
                _parentId: "0x91",
                _contentUri: contentUri,
                _categoryId: categoryId,
                _receivers: receivers.split(" ")
            },
            }
        await contractProcessor.fetch({params:options,
            onSuccess: () => message.success("success"),
            onError: (error) => message.error(error),
        });
    }

    const processContent = async (content) => {
        const ipfsResult = await ipfsProcessor.saveFile(
            "post.json",
            { base64: btoa(JSON.stringify(content)) },
            { saveIPFS: true}
        )
        return ipfsResult._ipfs;
    }

    const validateForm = () => {
        let result = !title || !content || !receivers ? false: true;
        if(receivers.includes(",")){
            result = false;
        }
        return result
    }

    const validateReceivers = () => {
        let spChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/;
        if(spChars.test(receivers)){
            return false;
        }
        let theReceivers = receivers.split(" ");
        theReceivers.forEach(receiver => {
            if(spChars.test(receiver)){
                return false;
            }
        });
        return true;
    }

   const clearForm = () =>{
        setTitle('');
        setContent('');
        setReceivers('');
    }
    
    function onSubmit(e){
        e.preventDefault();
        if(!validateForm()){
            return message.error("Remember to add the title, content, and receivers of your fundraiser.");
        }
        if(!validateReceivers()){
            return message.error("Receiver addresses must be separated by a space.");
        }
        createFund({title, content})
        clearForm();
    }
    
    

    return (
        <form onSubmit={onSubmit}>
        <div className ="row">
            <div className="form-group">
                <input
                type="text"
                className="mb-2 mt-2 form-control"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                type='text'
                className="mb-2 form-control"
                placeholder="Fundraiser Information"
                rows="5"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                />
                <textarea
                type='text'
                className="mb-2 form-control"
                placeholder="Fundraiser Receivers (addresses separated by spaces)"
                rows="5"
                value={receivers}
                onChange={(e) => setReceivers(e.target.value)}
                />
            </div>
            <button type="submit" className="btn btn-dark ">Submit</button>
        </div>
    </form>
    )
}

export default CreateFund
