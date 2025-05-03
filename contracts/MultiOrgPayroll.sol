// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MultiOrgPayroll {
    struct Employee {
        uint256 salary;
        address tokenAddress; // address(0) = ETH, otherwise ERC20
        bool exists;
        bool paid;
    }

    struct Organization {
        address owner;
        string name;
        mapping(address => Employee) employees;
        address[] employeeList;
        uint256 nextPayTimestamp;
        bool exists;
    }

    // Organization ID (address) => Organization data
    mapping(address => Organization) public organizations;
    // Track all organization IDs
    address[] public orgList;

    event OrganizationCreated(address indexed orgId, string name, address indexed owner);
    event EmployeeAdded(address indexed orgId, address indexed employee, uint256 salary, address token);
    event EmployeeRemoved(address indexed orgId, address indexed employee);
    event SalaryPaid(address indexed orgId, address indexed employee, uint256 amount, address token);
    event NextPayScheduled(address indexed orgId, uint256 timestamp);
    event Withdrawn(address indexed orgId, address token, uint256 amount);
    event Funded(address indexed orgId, address indexed sender, uint256 amount);

    modifier onlyOrgOwner(address _orgId) {
        require(organizations[_orgId].exists, "Organization doesn't exist");
        require(msg.sender == organizations[_orgId].owner, "Not authorized");
        _;
    }

    // Create a new organization
    function createOrganization(string memory _name) external returns (address orgId) {
        // Use msg.sender as the organization ID for simplicity
        // This ensures uniqueness and easy reference
        orgId = msg.sender;
        
        require(!organizations[orgId].exists, "Organization already exists for this address");
        
        Organization storage newOrg = organizations[orgId];
        newOrg.owner = msg.sender;
        newOrg.name = _name;
        newOrg.exists = true;
        
        orgList.push(orgId);
        
        emit OrganizationCreated(orgId, _name, msg.sender);
    }

    // Accept ETH transfers to fund an organization
    receive() external payable {
        require(organizations[msg.sender].exists, "Organization doesn't exist");
        emit Funded(msg.sender, msg.sender, msg.value);
    }
    
    // Fund an organization with ETH
    function fundOrganization(address _orgId) external payable {
        require(organizations[_orgId].exists, "Organization doesn't exist");
        emit Funded(_orgId, msg.sender, msg.value);
    }

    // Add an employee with salary and payment token (ETH = address(0))
    function addEmployee(address _orgId, address _employee, uint256 _salary, address _tokenAddress) 
        external onlyOrgOwner(_orgId) 
    {
        Organization storage org = organizations[_orgId];
        require(!org.employees[_employee].exists, "Employee already exists");
        
        org.employees[_employee] = Employee(_salary, _tokenAddress, true, false);
        org.employeeList.push(_employee);
        
        emit EmployeeAdded(_orgId, _employee, _salary, _tokenAddress);
    }

    // Remove an employee and clean up the list
    function removeEmployee(address _orgId, address _employee) 
        external onlyOrgOwner(_orgId) 
    {
        Organization storage org = organizations[_orgId];
        require(org.employees[_employee].exists, "Employee doesn't exist");
        
        delete org.employees[_employee];
        for (uint256 i = 0; i < org.employeeList.length; i++) {
            if (org.employeeList[i] == _employee) {
                org.employeeList[i] = org.employeeList[org.employeeList.length - 1];
                org.employeeList.pop();
                break;
            }
        }
        
        emit EmployeeRemoved(_orgId, _employee);
    }

    // Update salary or currency for an existing employee
    function updateEmployee(address _orgId, address _employee, uint256 _salary, address _tokenAddress) 
        external onlyOrgOwner(_orgId) 
    {
        Organization storage org = organizations[_orgId];
        require(org.employees[_employee].exists, "Employee doesn't exist");
        
        org.employees[_employee].salary = _salary;
        org.employees[_employee].tokenAddress = _tokenAddress;
    }

    // Schedule the next payment date
    function setNextPayDate(address _orgId, uint256 _timestamp) 
        external onlyOrgOwner(_orgId) 
    {
        require(_timestamp > block.timestamp, "Must be future time");
        organizations[_orgId].nextPayTimestamp = _timestamp;
        
        emit NextPayScheduled(_orgId, _timestamp);
    }

    // Pay all eligible employees
    function paySalaries(address _orgId) 
        external onlyOrgOwner(_orgId) 
    {
        Organization storage org = organizations[_orgId];
        require(block.timestamp >= org.nextPayTimestamp, "Too early to pay");

        for (uint256 i = 0; i < org.employeeList.length; i++) {
            address emp = org.employeeList[i];
            Employee storage e = org.employees[emp];
            if (!e.exists || e.paid) continue;

            if (e.tokenAddress == address(0)) {
                // Using ETH
                require(address(this).balance >= e.salary, "Insufficient ETH");
                payable(emp).transfer(e.salary);
            } else {
                // Using ERC20 token
                IERC20 token = IERC20(e.tokenAddress);
                require(token.balanceOf(address(this)) >= e.salary, "Insufficient token");
                require(token.transfer(emp, e.salary), "Token transfer failed");
            }

            e.paid = true;
            emit SalaryPaid(_orgId, emp, e.salary, e.tokenAddress);
        }
    }

    // Reset "paid" status before next cycle
    function resetPaymentStatus(address _orgId) 
        external onlyOrgOwner(_orgId) 
    {
        Organization storage org = organizations[_orgId];
        for (uint256 i = 0; i < org.employeeList.length; i++) {
            org.employees[org.employeeList[i]].paid = false;
        }
    }

    // Withdraw excess ETH or tokens from contract for a specific organization
    function withdraw(address _orgId, address _token, uint256 _amount) 
        external onlyOrgOwner(_orgId) 
    {
        if (_token == address(0)) {
            require(address(this).balance >= _amount, "Not enough ETH");
            payable(msg.sender).transfer(_amount);
        } else {
            IERC20 token = IERC20(_token);
            require(token.balanceOf(address(this)) >= _amount, "Not enough tokens");
            require(token.transfer(msg.sender, _amount), "Withdraw transfer failed");
        }
        
        emit Withdrawn(_orgId, _token, _amount);
    }

    // View functions
    function checkETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function checkTokenBalance(address _token) external view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    function getEmployeeStatus(address _orgId, address _employee)
        external
        view
        returns (uint256 salary, address token, bool paid)
    {
        Organization storage org = organizations[_orgId];
        require(org.exists, "Organization doesn't exist");
        require(org.employees[_employee].exists, "Employee doesn't exist");
        
        Employee memory e = org.employees[_employee];
        return (e.salary, e.tokenAddress, e.paid);
    }

    function getAllEmployees(address _orgId) 
        external view 
        returns (address[] memory) 
    {
        require(organizations[_orgId].exists, "Organization doesn't exist");
        return organizations[_orgId].employeeList;
    }
    
    function getOrganizationInfo(address _orgId) 
        external view 
        returns (address owner, string memory name, uint256 nextPayTimestamp, uint256 employeeCount) 
    {
        require(organizations[_orgId].exists, "Organization doesn't exist");
        Organization storage org = organizations[_orgId];
        
        return (org.owner, org.name, org.nextPayTimestamp, org.employeeList.length);
    }
    
    function getAllOrganizations() 
        external view 
        returns (address[] memory) 
    {
        return orgList;
    }
}