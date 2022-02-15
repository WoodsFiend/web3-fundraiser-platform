// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FundUs is Ownable {

    event FundCreated (bytes32 indexed fundId, address indexed fundOwner, bytes32 indexed parentId, bytes32 contentId, bytes32 categoryId, address[] receivers);
    event FundEnded (bytes32 indexed fundId, address indexed fundOwner, bytes32 indexed parentId, bytes32 contentId, bytes32 categoryId);

    event ContentAdded (bytes32 indexed contentId, string contentUri);
    event CategoryCreated (bytes32 indexed categoryId, string category);
    event Donated (uint256 amount, bytes32 indexed fundId, address indexed fundOwner, address indexed Donater, uint80 reputationfundOwner, uint80 reputationDonater, bool up, uint8 reputationAmount);
    event RetractedDonation (uint256 amount, bytes32 indexed fundId, address indexed fundOwner, address indexed Donater, uint80 reputationfundOwner, uint80 reputationDonater, bool up, uint8 reputationAmount);

    struct Fund {
        address fundOwner;
        bytes32 parentFund;
        bytes32 contentId;
        bytes32 categoryId;
        bool fundActive;
        mapping (address => uint256) donatedAmounts;
        mapping (address => uint8) repGiven;
        mapping (address => bool) receivers;
        uint256 totalReceivers;
        uint256 donations;
    }

    mapping  (address => mapping (bytes32 => uint80)) reputationRegistry;
    mapping (bytes32 => string) categoryRegistry;
    mapping (bytes32 => string) contentRegistry;
    mapping (bytes32 => Fund) FundRegistry;

    uint256 ownerRewards;
    
    function createFund(bytes32 _parentId, string calldata _contentUri, bytes32 _categoryId, address[] calldata _receivers) external {
        require(_receivers.length > 0, "The fund must have atleast one receiver");
        address _owner = msg.sender;
        bytes32 _contentId = keccak256(abi.encode(_contentUri));
        bytes32 _fundId = keccak256(abi.encodePacked(_owner,_parentId, _contentId));
        contentRegistry[_contentId] = _contentUri;
        FundRegistry[_fundId].fundOwner = _owner;
        FundRegistry[_fundId].parentFund = _parentId;
        FundRegistry[_fundId].contentId = _contentId;
        FundRegistry[_fundId].categoryId = _categoryId;       
        FundRegistry[_fundId].fundActive = true;

        //Add all receivers to the fund
        for (uint256 i = 0; i < _receivers.length; i++) {
            if(FundRegistry[_fundId].receivers[_receivers[i]] == false) {
                FundRegistry[_fundId].receivers[_receivers[i]] = true;
                FundRegistry[_fundId].totalReceivers++;
            }
        }
        emit ContentAdded(_contentId, _contentUri);
        emit FundCreated (_fundId, _owner,_parentId,_contentId,_categoryId, _receivers);
    }

    function donate(bytes32 _fundId) external payable {
        require(FundRegistry[_fundId].fundActive, "This fund is not active");
        require(msg.value > 0, "Cannot donate nothing to the fundraiser");
        address _Donater = msg.sender;
        bytes32 _category = FundRegistry[_fundId].categoryId;
        address _contributor = FundRegistry[_fundId].fundOwner;
        require (FundRegistry[_fundId].fundOwner != _Donater, "you cannot Donate to your own Funds");
        reputationRegistry[_contributor][_category] += 1;
        FundRegistry[_fundId].repGiven[_Donater] += 1;
        FundRegistry[_fundId].donatedAmounts[msg.sender] += msg.value;
        FundRegistry[_fundId].donations += msg.value;
        emit Donated(msg.value, _fundId, _contributor, _Donater, reputationRegistry[_contributor][_category], reputationRegistry[_Donater][_category], true, 1);
    }

    function retractDonation(address payable _receiver, bytes32 _fundId) external {
        require(FundRegistry[_fundId].fundActive, "This fund is not active");
        require(_receiver != address(0), "Cannot recover ETH to the 0 address");
        require(_receiver == msg.sender, "Cannot recover ETH to a different address");
        require(FundRegistry[_fundId].donatedAmounts[_receiver] > 0, "This address has not donated to this fund");
        address _Donater = msg.sender;
        bytes32 _category = FundRegistry[_fundId].categoryId;
        address _contributor = FundRegistry[_fundId].fundOwner;
        uint8 _reputationTaken = FundRegistry[_fundId].repGiven[_receiver];
        reputationRegistry[_contributor][_category] -= _reputationTaken;   
        FundRegistry[_fundId].repGiven[_receiver] = 0;

        uint256 amount = FundRegistry[_fundId].donatedAmounts[_receiver];
        FundRegistry[_fundId].donatedAmounts[_receiver] = 0;
        FundRegistry[_fundId].donations -= amount;

        _receiver.transfer(amount);

        emit RetractedDonation(amount, _fundId, _contributor, _Donater, reputationRegistry[_contributor][_category], reputationRegistry[_Donater][_category], false, _reputationTaken);
    }

    function addCategory(string calldata _category) external {
        bytes32 _categoryId = keccak256(abi.encode(_category));
        categoryRegistry[_categoryId] = _category;
        emit CategoryCreated(_categoryId, _category);
    }
    
    function getContent(bytes32 _contentId) public view returns (string memory) {
        return contentRegistry[_contentId];
    }
    
    function getCategory(bytes32 _categoryId) public view returns(string memory) {   
        return categoryRegistry[_categoryId];
    }

    function getReputation(address _address, bytes32 _categoryID) public view returns(uint80) {   
        return reputationRegistry[_address][_categoryID];
    }

    function getFund(bytes32 _fundId) public view returns(address, bytes32, bytes32, bytes32, bool, uint256, uint256) {   
        return (
            FundRegistry[_fundId].fundOwner,
            FundRegistry[_fundId].parentFund,
            FundRegistry[_fundId].contentId,
            FundRegistry[_fundId].categoryId,
            FundRegistry[_fundId].fundActive,
            FundRegistry[_fundId].totalReceivers,
            FundRegistry[_fundId].donations   
            );
    }

    function endFund(bytes32 _fundId) external {
        require(FundRegistry[_fundId].fundOwner == msg.sender, "Only the fund owner can end the fund");
        require(FundRegistry[_fundId].fundActive, "The fund has already ended");
        ownerRewards += FundRegistry[_fundId].donations / 50;
        FundRegistry[_fundId].donations = (FundRegistry[_fundId].donations / 50) * 49;
        FundRegistry[_fundId].fundActive = false;
        address _owner = FundRegistry[_fundId].fundOwner;
        bytes32 _parentId = FundRegistry[_fundId].parentFund;
        bytes32 _contentId = FundRegistry[_fundId].contentId ;
        bytes32 _categoryId = FundRegistry[_fundId].categoryId;
        emit FundEnded (_fundId, _owner,_parentId,_contentId,_categoryId);

    }

    function withdrawFunding(bytes32 _fundId, address payable _receiver) external {
        require(_receiver != address(0), "Cannot recover ETH to the 0 address");
        require(!FundRegistry[_fundId].fundActive, "This fund is still active");
        require (FundRegistry[_fundId].receivers[_receiver] == true, "you cannot withdraw funds if you are not a receiver");
        FundRegistry[_fundId].receivers[_receiver] = false;
        _receiver.transfer(FundRegistry[_fundId].donations / FundRegistry[_fundId].totalReceivers);
    }

    function withdrawOwnerRewards(address payable receiver) external onlyOwner {
        require(receiver != address(0), "Cannot recover ETH to the 0 address");
        receiver.transfer(ownerRewards);
    }

}