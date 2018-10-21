package com.capco.spa.jpa.dao;

import java.util.List;

import javax.persistence.PersistenceContext;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.capco.spa.jpa.entity.Calculation;

@Repository
@PersistenceContext(name = "primaryE1M")
public interface CalculationDao extends JpaRepository<Calculation, Long>{

    @EntityGraph(value = "allJoins", type = EntityGraph.EntityGraphType.LOAD)
    @Query("select c from Calculation c where c.id= :calculationId")
    Calculation findCalculationById( @Param("calculationId") Long calculationId);

    @EntityGraph(value = "basicJoins", type = EntityGraph.EntityGraphType.LOAD)
    @Query("select distinct c from Calculation c")
    List<Calculation> findAll();

    @Query("select c from Calculation c where c.id= :calculationId")
    Calculation findBasicCalculationById( @Param("calculationId") Long calculationId);

    Calculation findByName(String name);

    @Query("select c.readOnly from Calculation c where c.id= :calculationId")
    Boolean findCalculationReadOnly(@Param("calculationId") Long calculationId);

}
